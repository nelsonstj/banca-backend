const log = require('../helpers/log').logger;
const bodybuilder = require('bodybuilder');
const _ = require('lodash');
const es = require('../helpers/esOperation');

const SISCOM_PROGRAMS = 'siscom_programs';

let _queryProgramData = (initials) => {

    // log.debug('SiscomProgramController -> queryProgramData');

    const bob = bodybuilder();

    bob.query('term', 'Acronym', initials.toLowerCase());

    let b = bob.from(0).size(40).build();

    return es.search({
        index: SISCOM_PROGRAMS,
        body: b
    }).then(result => result.hits.hits.map((value) => {
        let newStartDate = _defineNewStartTime(value._source.Acronym);
        value._source.StartTime = newStartDate !== undefined ? newStartDate : value._source.StartTime;
        return value._source;
    }));
};

let _queryNationalPrograms = () => {

    // log.debug('SiscomProgramController -> queryNationalPrograms');

    let indexData = ["MAVO", "GESP", "JHOJ", "VIDE", "TARA", "VALE", "MALH", "SAME", "SERA", "ANGE", "HUCK", "ALTA", "GRUD", "TMAX", "DOMA"];

    let bob = bodybuilder();

    _.map(indexData, m => {
        bob = bob.orQuery('match', 'Acronym', m);
    });

    return es.search({
        index: SISCOM_PROGRAMS,
        body: bob.from(0).size(1000).build()
    }).then(result => result.hits.hits.map((value) => {
        let newStartDate = _defineNewStartTime(value._source.Acronym);
        value._source.StartTime = newStartDate !== undefined ? newStartDate : value._source.StartTime;
        return value._source;
    }));
};

let _defineNewStartTime = (programAcronym) => {

    // log.debug('SiscomProgramController -> defineNewStartTime');

    const overrideTimes = {
        "hora": new Date(2000, 1, 1, 5, 0),
        "best": new Date(2000, 1, 1, 10, 10),
        "fati": new Date(2000, 1, 1, 10, 50),
        "n18h": new Date(2000, 1, 1, 18, 30),
        "n19h": new Date(2000, 1, 1, 19, 35),
        "n20h": new Date(2000, 1, 1, 21, 15),
        "jnac": new Date(2000, 1, 1, 20, 30),
        "repo": new Date(2000, 1, 1, 22, 35),
        "casa": new Date(2000, 1, 1, 9, 0),
        "suci": new Date(2000, 1, 1, 1),
        "fant": new Date(2000, 1, 1, 21)
    };

    return overrideTimes[programAcronym.toLowerCase()];
};

module.exports = {
    queryProgramData: _queryProgramData,
    queryNationalPrograms: _queryNationalPrograms

};