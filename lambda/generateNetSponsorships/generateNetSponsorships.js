const siscomProgramController = require('../../controllers/SiscomProgramController');
const priceTableController = require('../../controllers/SiscomPriceTableController');
const siscomPlanController = require('../../controllers/siscomPlan');
const _ = require('lodash');
const moment = require('moment');
const es = require('../../helpers/elastic').client;

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1', credentials: new AWS.Credentials("???", "???") });

const UNAVAILABLE_STATUS = 2;
const BANCA_INDEX = "banca";

exports.handler = (event, context, callback) => {
  let responseData = [];
  siscomProgramController.queryNationalPrograms().then(programs => {
    responseData = programs.map(function (data) {
      let parsedStartTime = moment(data.StartTime, moment.ISO_8601).format("HH:mm");
      let presentationDaysArray = _.split("Domingo, Segunda-Feira, Terça-Feira, Quarta-Feira, Quinta-Feira, Sexta-Feira, Sábado", ", ");
      let parsedPresentationDays = _.map(_.split(data.PresentationDays, ", "), m => { return presentationDaysArray.indexOf(m) });

      return {
        "name": data.Name,
        "published": true,
        "net_sponsorship": {
          "program_initials": data.Acronym,
          "program_days": parsedPresentationDays,
          "start_time": parsedStartTime,
          "gender": data.Gender
        },
        "main_type": "net_sponsorship",
        "id": data.Id,
        "conversionIndex": getProgramIndex(data.Acronym)
      }
    });

    let competence = calibrateStartDate(event.competence) || calibrateStartDate(new Date());

    return Promise.all(responseData.map(m => {
      return priceTableController.queryProgramPriceTable(m.net_sponsorship.program_initials, moment(competence).startOf("month").format("YYYY-MM-DD"));
    }));
  }).then(priceTableData => {
    console.log("Consultando planos locais dos programas");

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

    return Promise.all(_.map(responseData, m => { return siscomPlanController.getSiscomPlans(m.net_sponsorship.program_initials, "L") }));
  }).then(siscomData => {
    console.log("Adaptando dados para inserção no ES");
    let filteredSiscomData = _.flatten(siscomData);

    responseData = responseData.map(m => {
      let filteredSiscomPlans = _.filter(filteredSiscomData, { 'programInitials': m.net_sponsorship.program_initials, 'status': 2 });

      if (filteredSiscomPlans.length > 0) {
        let siscom_plan = filteredSiscomPlans[0];
        m.availability = siscom_plan.availability;
        m.siscom_id = siscom_plan.id;
        m.priorityDate = siscomPlanController.calculateEarliestPriorityDate(siscom_plan);
        siscom_plan = siscomPlanController.fixSiscomQuotaData(siscom_plan);
        m.siscom_data = siscom_plan;
        return m;
      }
      else {
        m.availability = UNAVAILABLE_STATUS;
        return m;
      }
    });

    const resultArray = [];

    const body = responseData.forEach(element => {
      resultArray.push({ update: { _index: BANCA_INDEX, _type: 'net_sponsorships', _id: element.id } });
      let result = {
        "doc_as_upsert": true,
        "detect_noop": false,
        "doc": {
          name: element.name,
          attachments: [],
          siscom_id: element.siscom_id,
          published: element.published,
          net_sponsorship: element.net_sponsorship,
          main_type: element.main_type,
          conversionIndex: element.conversionIndex,
          priceTable: element.priceTable,
          siscom_data: element.siscom_data,
          updated_at: moment().utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
          priorityDate: element.priorityDate
        }
      }
      resultArray.push(result);
    });

    console.log("Inserindo dados no ES");
    return es.bulk({ body: resultArray, timeout: "5m" });
  }).then(function (data) {
    callback(null, JSON.stringify(data));
  }).catch(function (erro) {
    callback(erro);
  });
};

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


/**
 * @param {*} startDate 
 * 
 * @description A consulta deve considerar somente os meses de referência (Abril e Outubro). 
 * Datas que não estejam em um mês de referência será adaptado para o mês de referência anterior (tabela de preços vigente).
 */
function calibrateStartDate(startDate) {
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
}
