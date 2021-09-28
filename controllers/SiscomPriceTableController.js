const log = require('../helpers/log').logger;
const bodybuilder = require('bodybuilder');
const moment = require('moment');
const _ = require('lodash');
const es = require('../helpers/esOperation');

/**
 * @param {*} startDate
 *
 * @description A consulta deve considerar somente os meses de referência (Abril e Outubro).
 * Datas que não estejam em um mês de referência será adaptado para o mês de referência anterior (tabela de preços vigente).
 */
let _calibrateStartDate = (startDate) => {

    log.debug('SiscomPriceTableController -> calibrateStartDate');

    let startMonth = parseInt(moment(startDate, moment.ISO_8601).format("MM"), 10);

    if (startMonth > 4 && startMonth < 10) {
        return moment(startDate).month(3);
    }

    if ((startMonth > 10)) {
        return moment(startDate).month(9);
    }

    if (startMonth >= 1 && startMonth <= 3) {
        return moment(startDate).subtract(1, 'year').month(9);
    }

    return moment(startDate).startOf("day");
};

let _getProgramIndex = (acronym) => {
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
    };

    return _.includes(_.keys(indexData), acronym.toUpperCase()) ? indexData[acronym.toUpperCase()] : 1;
};

let _groupPricesByCompetence = (openPriceData, initials) => {

    log.debug('SiscomPriceTableController -> groupPricesByCompetence');

    return _.map(_.groupBy(openPriceData, d => d.exhibitor), (value, key) => {
        return {
            "exhibitor": key,
            "prices": value.reduce((p, c) => {
                let reference = moment(c.date, moment.ISO_8601).format("MM-DD");
                if (reference === "04-01" || reference === "10-01") {
                    return p.concat({
                        "price30Seconds": c.price30Seconds,
                        "referenceDate": c.date,
                        "monthlyPrice": c.price30Seconds * _getProgramIndex(initials)
                    });
                }
                return p;
            }, [])
        }
    });
};

let _queryPriceTable = (startDate, endDate, initials, exhibitors) => {

    log.debug('SiscomPriceTableController -> queryPriceTable');

    let formattedStartDate = moment(startDate).format("YYYY-MM-DD");
    let formattedEndDate = moment(endDate).format("YYYY-MM-DD");
    let formattedInitials = initials.toLowerCase();

    let query = bodybuilder();
    query = query.query('match', 'ProgramName', formattedInitials);
    query = query.andQuery('range', 'TableReferenceDate', {
        "gte": formattedStartDate,
        "lte": formattedEndDate,
        "format": "yyyy-MM-dd"
    });
    query = query.andQuery('match', 'IsolatedPrice', true);
    query = query.size(10000);

    if (exhibitors !== null && typeof exhibitors !== "undefined" && exhibitors.length > 0) {
        exhibitors.forEach(function (element) {
            query.orQuery('match', 'SubExhibitor', element);
        });
        query.queryMinimumShouldMatch(1);
    }

    query.filter('match', 'Exhibitor', 'NAC');

    return es.search({"index": "siscom_pricetables", "type": "siscom_pricetable", "body": query.build()}).then(data => {
        return _parsePriceTableData(data);
    }).catch(err => {
        return err;
    });
};

let _queryProgramPriceTable = (initials, competence) => {

    log.debug('SiscomPriceTableController -> queryProgramPriceTable');

    let formattedInitials = initials.toLowerCase();
    const EXCLUDED_EXHIBITORS = ["sup", "val", "aca"];

    let query = bodybuilder();

    query.query('match', 'ProgramName', formattedInitials);
    query.andQuery('match', 'IsolatedPrice', true);
    query.andQuery('range', 'TableReferenceDate', {"lte": competence, "gte": competence, "format": "yyyy-MM-dd"});

    const queryComponents = EXCLUDED_EXHIBITORS.map(m => {
        return {"match": {"SubExhibitor": m}}
    });

    query.andQuery("bool", "must_not", queryComponents);
    query.filter('match', 'Exhibitor', 'NAC');

    // Lembrando que são 123 exibidoras: temos que conter todas elas!
    query.size(5000);

    return es.search({"index": "siscom_pricetables", "type": "siscom_pricetable", "body": query.build()}).then(data => {
        return _parsePriceTableData(data);
    }).catch(err => {
        return err;
    });
};

let _parsePriceTableData = (data) => {

    log.debug('SiscomPriceTableController -> parsePriceTableData');

    return new Promise((resolve) => {
        resolve(data.hits.hits.map(s => {
            return _buildPriceTableFromES(s._source);
        }))
    });
};

let _buildPriceTableFromES = (data) => {

    log.debug('SiscomPriceTableController -> buildPriceTableFromES');

    return {
        "acronym": data.ProgramName,
        "exhibitor": data.SubExhibitor,
        "date": data.TableReferenceDate,
        "price30Seconds": data.Price30Seconds
    }
};

module.exports = {
    queryPriceTable: _queryPriceTable,
    queryProgramPriceTable: _queryProgramPriceTable,
    calibrateStartDate: _calibrateStartDate,
    getProgramIndex: _getProgramIndex,
    groupPricesByCompetence: _groupPricesByCompetence
};