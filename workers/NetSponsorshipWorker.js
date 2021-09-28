const _ = require('lodash');
const moment = require('moment');

class netSponsorshipWorker {
    constructor({ esClient, siscomProgramController, priceTableController, siscomPlanController }) {
        this.esClient = esClient;
        this.siscomProgramController = siscomProgramController;
        this.priceTableController = priceTableController;
        this.siscomPlanController = siscomPlanController;
    }

    generateNetSponsorships() {
        let responseData = [];

        return this.siscomProgramController.queryNationalPrograms(this.esClient).then(programs => {
            responseData = programs.map(function (data) {
                let parsedStartTime = moment(data.StartTime, moment.ISO_8601).format("HH:mm");
                let presentationDaysArray = _.split("Domingo, Segunda-Feira, Terça-Feira, Quarta-Feira, Quinta-Feira, Sexta-Feira, Sábado", ", ");
                let parsedPresentationDays = _.map(_.split(data.PresentationDays, ", "), m => { return presentationDaysArray.indexOf(m) });

                return {
                    name: data.Name,
                    published: true,
                    net_sponsorship: {
                        program_initials: data.Acronym,
                        program_days: parsedPresentationDays,
                        start_time: parsedStartTime,
                        gender: data.Gender
                    },
                    main_type: "net_sponsorship",
                    id: data.Id,
                    "conversionIndex": getProgramIndex(data.Acronym)
                }
            })

            return Promise.all(responseData.map(m => { return this.priceTableController.queryProgramPriceTable(this.esClient, m.net_sponsorship.program_initials) }));
        }).then(priceTableData => {
            let flattenedData = _.flatten(priceTableData);
            responseData = responseData.map(m => {
                return _.assign(m, {
                    "priceTable": _.map(_.filter(flattenedData, { 'acronym': m.net_sponsorship.program_initials }),
                        mm => {
                            let parsedDate = moment.utc(mm.date, moment.ISO_8601);

                            return {
                                "referenceDate": parsedDate,
                                "exhibitor": mm.exhibitor,
                                "monthlyPrice": mm.price30Seconds * m.conversionIndex
                            }
                        }
                    )
                })
            });

            return Promise.all(_.map(responseData, m => { return this.siscomPlanController.getSiscomPlans(this.esClient, m.net_sponsorship.program_initials, "L") }));
        }).then(sponsorData => {
            let flattenedSponsors = _.flatten(sponsorData);

            responseData = responseData.map(m => {
                let filteredSponsorData = _.filter(flattenedSponsors, { 'programInitials': m.net_sponsorship.program_initials });

                let siscom_data = _.assign(filteredSponsorData, {
                    "isAvailable": _.reduce(_.map(m.quotas, mm => { return mm.clientName === '' }),
                        (previous, current) => {
                            return previous == true ? true : current
                        })
                });

                filteredSponsorData.forEach((currentSponsor, index) => {
                    let availableQuotas = [];

                    let quotaQuantity = _.uniq(_.map(currentSponsor.quotas, m => { return m.number })).length;

                    const data = _.map(_.groupBy(currentSponsor.quotas, g => g.exhibitedAt), (quotas) => {
                        const locationData = {};
                        locationData.availableQuota = [];
                        locationData.soldQuota = [];

                        _.map(_.groupBy(quotas, q => q.number), quotaNumberArray => {
                            let lastQuota = _.takeRight(quotaNumberArray)[0];
                            locationData.location = lastQuota.exhibitedAt;

                            if (lastQuota.clientName == '') {
                                locationData.availableQuota.push(lastQuota.number);
                                availableQuotas[lastQuota.number - 1] = true;
                            } else {
                                locationData.soldQuota.push({
                                    clientName: lastQuota.clientName,
                                    number: lastQuota.number,
                                    "renewLimit": lastQuota.renewLimit,
                                    "exhibitionStart": lastQuota.exhibitionStart,
                                    "exhibitionEnd": lastQuota.exhibitionEnd
                                });
                            }
                        });

                        return locationData;
                    });

                    let finalData = {};
                    finalData.quotas = data;

                    finalData.quotas = _.orderBy(finalData.quotas, ['availableQuota.length', 'location'], ["desc", "asc"]);
                    let availableQuotaCount = availableQuotas.reduce((p, c) => { return c === true ? p + 1 : p }, 0);

                    _.assign(finalData,
                        { availableQuotas: availableQuotaCount },
                        { soldQuotas: quotaQuantity - availableQuotaCount }
                    );

                    _.assign(siscom_data[index], finalData);
                });

                siscom_data = siscom_data[0];
                return _.assign(m, { siscom_data });
            });

            return new Promise((resolve, reject) => {
                resolve(responseData);
            });
        });
    };

    insertGeneratedNetSponsorships(responseData) {
        const resultArray = [];

        const body = responseData.forEach(element => {
            resultArray.push({ update: { _index: 'net_sponsorships', _type: 'net_sponsorship', _id: element.id } });
            let result = {
                "doc_as_upsert": true,
                "doc": {
                    name: element.name,
                    published: element.published,
                    net_sponsorship: element.net_sponsorship,
                    main_type: element.main_type,
                    conversionIndex: element.conversionIndex,
                    priceTable: element.priceTable,
                    siscom_data: element.siscom_data,
                    updated_at: new Date()
                }
            }
            resultArray.push(result);
        });

        let size = 0;
        let stepSize = 50;
        let promises = [];

        while (size < resultArray.length) {
            promises.push(this.esClient.bulk({ body: _.take(_.drop(resultArray, size), stepSize), timeout: "5m" }));
            size += stepSize;
        }

        return Promise.all(promises);
    }
}

function getProgramIndex(acronym) {
    let indexData = {
        "MAVO": 16.5,
        "GESP": 19.5,
        "JHOJ": 19.5,
        "VIDE": 16.5,
        "TARA": 16.5,
        "VALE": 16.5,
        "MALH": 16.5,
        "SAME": 16.5,
        "SERA": 3.25,
        "ANGE": 3.25,
        "HUCK": 3.25,
        "ALTA": 3.25,
        "GRUD": 3.25,
        "TMAX": 3.25,
        "DOMA": 3.25
    }

    return _.includes(_.keys(indexData), acronym.toUpperCase()) ? indexData[acronym.toUpperCase()] : 1;
}

module.exports = netSponsorshipWorker;