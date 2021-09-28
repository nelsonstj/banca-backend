const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');

const siscomPlanController = require('../../controllers/siscomPlan.js');

AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.Credentials(
    '???',
    '???'
  )
});

const hostName = 'https://search-bancadev-???.us-east-1.es.amazonaws.com';
const UNAVAILABLE_STATUS = 2;
const BANCA_INDEX = 'banca';

const _client = require('elasticsearch').Client({
  hosts: [hostName],
  connectionClass: require('http-aws-es'),
  log: 'error',
  requestTimeout: 90000
});

function querySponsorships(client) {
  const promise = new Promise((resolve, reject) => {
    const sponsorshipResolutions = [];

    console.log('Consultando patrocínios registrados no ES', hostName);

    return client.search(
      {
        index: 'banca',
        type: 'sponsorships',
        scroll: '3m',
        size: 100
      },
      function getMoreUntilDone(error, response) {
        if (error) {
          reject(error);
          return;
        }
        response.hits.hits.forEach((hit) => {
          sponsorshipResolutions.push(_.assign(hit._source, { id: hit._id }));
        });

        if (response.hits.total > sponsorshipResolutions.length) {
          client.scroll(
            {
              scrollId: response._scroll_id,
              scroll: '3m'
            },
              getMoreUntilDone
            );
        } else {
          console.log('Consulta de patrocínios finalizada');
          resolve(sponsorshipResolutions);
        }
      }
    );
  });

  return promise;
}

exports.handler = (context, event, callback) =>
  querySponsorships(_client).then((data) => {
    const promises = [];

    data.forEach((element) => {
      if (element.siscom_id) {
        promises.push(
          getSiscomQuotas(element.siscom_id)
            .then((siscomData) => {
              updateSponsorshipData(element, siscomData);
            })
            .then(() => console.log('Updated element:', element.id))
            .catch((err) => {
              const errorMessage = `Something went wrong for element ${element.id}: ${err}`;
              callback(errorMessage);
            })
        );
      } else {
        promises.push(
          updateSponsorshipData(element)
            .then(() => {
              console.log('Updated element:', element.id);
            })
            .catch((err) => {
              console.log('Something went wrong for element:', element.id, ':', err);
            })
        );
      }
    });

    return Promise.all(promises)
      .then(() => callback(null, 'done'))
      .catch(err => callback(err));
  });

function getSiscomQuotas(id) {
  return new Promise((resolve, reject) => {
    _client.get(
      {
        index: 'siscom_plans',
        type: 'siscom_plan',
        id
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data._source);
        }
      }
    );
  });
}

function updateSponsorshipData(sponsorship, siscomData) {
  const updateData = {
    index: BANCA_INDEX,
    type: 'sponsorships',
    id: sponsorship.id,
    body: {
      doc: {},
      doc_as_upsert: true
    }
  };

  if (siscomData) {
    const fixedSiscomData = fixSiscomQuotaData(siscomData);
    updateData.body.doc.siscom_data = fixedSiscomData;
    const priorityDate = siscomPlanController.calculateEarliestPriorityDate(siscomData);
    updateData.body.doc.priorityDate = priorityDate;
    updateData.body.doc.availability = siscomData.availability;
  } else {
    updateData.body.doc.availability = UNAVAILABLE_STATUS;
  }

  return new Promise((resolve, reject) => {
    _client.update(updateData, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function fixSiscomQuotaData(siscomData) {
  return siscomPlanController.fixSiscomQuotaData(siscomData);
}
