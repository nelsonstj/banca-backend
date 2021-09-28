const netSponsorshipWorker = require('../../../workers/NetSponsorshipWorker');
const assert = require('chai').assert;

describe('GenerateNetSponsorships Lambda', () => {
    describe('GenerateNetSponsorships', () => {
        it('Should generate Net Sponsorship with quotas ordered by availability', () => {
            // Need shims for other controllers
            let siscomProgramController = {
                "queryNationalPrograms": (client) => {
                    return new Promise((resolve, reject) => {
                        resolve([{
                            "updatedAt": "2017-08-28T18:35:46.313Z",
                            "Id": 81,
                            "Acronym": "MAVO",
                            "Name": "MAIS VOCE",
                            "StartTime": "2004-10-01T08:00:00",
                            "PresentationDays": "Segunda-Feira, Terça-Feira, Quarta-Feira, Quinta-Feira, Sexta-Feira",
                            "Gender": "SHOW"
                        }]);
                    });
                }
            };

            let priceTableController = {
                "queryProgramPriceTable": (client, initials) => {
                    return new Promise((resolve, reject) => {
                        resolve([{
                            "acronym": "MAVO",
                            "exhibitor": "AXA",
                            "date": new Date(),
                            "price30Seconds": 666
                        }]);
                    });
                }
            }

            let siscomPlanController = {
                "getSiscomPlans": (client, initials, type) => {
                    return new Promise((resolve, reject) => {
                        resolve([{
                            "id": 1,
                            "status": 4,
                            "purchaseStatus": 1,
                            "availabilityStart": "2017-03-15T00:00:00",
                            "availabilityEnd": "2017-03-25T00:00:00",
                            "purchaseLimitStart": "2017-02-07T00:00:00",
                            "purchaseLimitEnd": "2017-02-20T00:00:00",
                            "programInitials": "MAVO",
                            "description": "Feipesca 2017",
                            "restrictedSaleCode": "1",
                            "queueCode": "N",
                            "quotas": [
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "BAG",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "BAG",
                                    "clientName": "some client / some category"
                                },
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "XYZ",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "XYZ",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "CAV",
                                    "clientName": "some client again / some other category"
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "CAV",
                                    "clientName": "some client instead / some other category yet"
                                }
                            ],
                            "marketType": "L",
                            "updatedAt": "2017-06-14T11:52:58.701Z"
                        }])
                    })
                }
            };

            let worker = new netSponsorshipWorker({
                "siscomProgramController": siscomProgramController,
                "priceTableController": priceTableController,
                "siscomPlanController": siscomPlanController
            });

            assert.isNotNull(worker, "We must be able to instantiate the worker!");

            worker.generateNetSponsorships().then(data => {
                // Validating projects filtered here
                assert.isNotNull(data, "There must be some project here!");
                assert.equal(1, data.length, "There must be one project here!");

                // Validating quotas here
                assert.equal(3, data[0].siscom_data.quotas.length, "Result must have 3 exhibitors!");
                assert.equal('XYZ', data[0].siscom_data.quotas[0].location, "Exhibitor XYZ must come first!");
                assert.equal('BAG', data[0].siscom_data.quotas[1].location, "Exhibitor BAG must come second!");
                assert.equal('CAV', data[0].siscom_data.quotas[2].location, "Exhibitor CAV must come third!");

            }).catch(err => {
                console.log(err);
            })
        });

        it('Should generate Net Sponsorship with quotas ordered by availability and alphabetic order', () => {
            // Need shims for other controllers
            let siscomProgramController = {
                "queryNationalPrograms": (client) => {
                    return new Promise((resolve, reject) => {
                        resolve([{
                            "updatedAt": "2017-08-28T18:35:46.313Z",
                            "Id": 81,
                            "Acronym": "MAVO",
                            "Name": "MAIS VOCE",
                            "StartTime": "2004-10-01T08:00:00",
                            "PresentationDays": "Segunda-Feira, Terça-Feira, Quarta-Feira, Quinta-Feira, Sexta-Feira",
                            "Gender": "SHOW"
                        }]);
                    });
                }
            };

            let priceTableController = {
                "queryProgramPriceTable": (client, initials) => {
                    return new Promise((resolve, reject) => {
                        resolve([{
                            "acronym": "MAVO",
                            "exhibitor": "AXA",
                            "date": new Date(),
                            "price30Seconds": 666
                        }]);
                    });
                }
            }

            let siscomPlanController = {
                "getSiscomPlans": (client, initials, type) => {
                    return new Promise((resolve, reject) => {
                        resolve([{
                            "id": 1,
                            "status": 4,
                            "purchaseStatus": 1,
                            "availabilityStart": "2017-03-15T00:00:00",
                            "availabilityEnd": "2017-03-25T00:00:00",
                            "purchaseLimitStart": "2017-02-07T00:00:00",
                            "purchaseLimitEnd": "2017-02-20T00:00:00",
                            "programInitials": "MAVO",
                            "description": "Feipesca 2017",
                            "restrictedSaleCode": "1",
                            "queueCode": "N",
                            "quotas": [
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "BAG",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "BAG",
                                    "clientName": "some client / some category"
                                },
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "AAA",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "AAA",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "ABB",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "ABB",
                                    "clientName": ""
                                },
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "BAA",
                                    "clientName": "some client again / some other category"
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "BAA",
                                    "clientName": "some client instead / some other category yet"
                                },
                                {
                                    "range": "L",
                                    "number": 1,
                                    "position": 1,
                                    "exhibitedAt": "BAX",
                                    "clientName": "some client again / some other category"
                                },
                                {
                                    "range": "L",
                                    "number": 2,
                                    "position": 2,
                                    "exhibitedAt": "BAX",
                                    "clientName": "some client instead / some other category yet"
                                }
                            ],
                            "marketType": "L",
                            "updatedAt": "2017-06-14T11:52:58.701Z"
                        }])
                    })
                }
            };

            let worker = new netSponsorshipWorker({
                "siscomProgramController": siscomProgramController,
                "priceTableController": priceTableController,
                "siscomPlanController": siscomPlanController
            });

            assert.isNotNull(worker, "We must be able to instantiate the worker!");

            worker.generateNetSponsorships().then(data => {
                // Validating projects filtered here
                assert.isNotNull(data, "There must be some project here!");
                assert.equal(1, data.length, "There must be one project here!");

                // Validating quotas here
                assert.equal(5, data[0].siscom_data.quotas.length, "Result must have 3 exhibitors!");
                assert.equal('AAA', data[0].siscom_data.quotas[0].location, "Exhibitor AAA must come first!");
                assert.equal('ABB', data[0].siscom_data.quotas[1].location, "Exhibitor ABB must come second!");
                assert.equal('BAG', data[0].siscom_data.quotas[2].location, "Exhibitor BAG must come third!");
                assert.equal('BAA', data[0].siscom_data.quotas[3].location, "Exhibitor BAA must come third!");
                assert.equal('BAX', data[0].siscom_data.quotas[4].location, "Exhibitor BAX must come third!");                
            }).catch(err => {
                console.log(err);
            })
        });
    });
});