const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');
const bluebird = require('bluebird');
const moment = require('moment');
const siscomPlanController = require('../../controllers/siscomPlan.js');

AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.Credentials(
    '???',
    '???'
  )
});

const queryProjectsAsync = bluebird.promisify(queryProjects);
const hostName = 'https://search-bancadev-???';
const UNAVAILABLE_STATUS = 2;
const BANCA_INDEX = 'banca';

const _client = require('elasticsearch').Client({
  hosts: [hostName],
  connectionClass: require('http-aws-es'),
  log: 'error',
  requestTimeout: 90000
});

function queryProjects(client, cb) {
  const projectResolutions = [];

  console.log('Consultando projetos registrados no ES');

  return client.search(
    {
      index: 'banca',
      type: 'projects',
      scroll: '3m',
      size: 100
    },
    function getMoreUntilDone(error, response) {
      if (error) {
        throw error;
      } else {
        response.hits.hits.forEach((hit) => {
          projectResolutions.push(_.assign(hit._source, { id: hit._id }));
        });

        if (response.hits.total > projectResolutions.length) {
          client.scroll(
            {
              scrollId: response._scroll_id,
              scroll: '3m'
            },
            getMoreUntilDone
          );
        } else {
          console.log('Consulta de projetos finalizada');
          cb(null, projectResolutions);
        }
      }
    }
  );
}

function calculatePriorityDate(projectData) {
  if (projectData.renew_limit_date) {
    return projectData.renew_limit_date;
  }
  if (projectData.national) {
    return projectData.national.exhibition.end;
  } else if (projectData.local) {
    return projectData.local.exhibition.end;
  } else if (
      projectData.main_type === 'digital_media' &&
      projectData.digital_media.exhibition.end
    ) {
    return projectData.digital_media.exhibition.end;
  }


  return null;
}

exports.handler = (context, event, callback) =>
  queryProjectsAsync(_client).then((data) => {
    console.log('Quantidade de projetos:', data.length);

    const nationalProjects = _.filter(data, f => f.main_type === 'national' && !!f.national);
    console.log('Projetos nacionais:', nationalProjects.length);

    const localProjects = _.filter(data, f => f.main_type === 'local');
    console.log('Projetos locais:', localProjects.length);

    const digitalProjects = _.filter(data, f => f.main_type === 'digital_media');
    console.log('Projetos digitais:', digitalProjects.length);

    const promises = [];
    const projects = nationalProjects.concat(localProjects).concat(digitalProjects);

    projects.forEach((element) => {
      if (element.siscom_id) {
        promises.push(
          getSiscomQuotas(element.siscom_id)
            .then((siscomData) => {
              updateProjectData(element, siscomData);
            })
            .then(() => console.log('Updated element:', element.id))
            .catch(err => console.log('Something went wrong for element', element.id, ':', err))
        );
      } else {
        promises.push(
          updateProjectData(element)
            .then((data) => {
              console.log('data', data);
              console.log('Updated element:', element.id);
            })
            .catch((err) => {
              console.log('Something went wrong for element:', element.id, ':', err);
            })
        );
      }
    });

    Promise.all(promises)
      .then(() => {
        callback(null, 'Processo finalizado com sucesso.');
      })
      .catch((err) => {
        callback(`Ocorreu um erro no processo: ${err}`);
      });
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

function addExhibitionEnd(exhibition) {
  // convertion hours to milliseconds
  if (exhibition === null || typeof exhibition === 'undefined') {
    return null;
  }

  if (exhibition.start && _.isNumber(exhibition.duration)) {
    const milliseconds = exhibition.duration * 3600 * 1000;
    const endDate = new Date(Date.parse(exhibition.start) + milliseconds);
    return _.assign(exhibition, { end: endDate.toISOString() });
  }
  return exhibition;
}

function updateProjectData(project, siscomData) {
  const updateData = {
    index: BANCA_INDEX,
    type: 'projects',
    id: project.id,
    body: {
      doc: {},
      doc_as_upsert: true,
      detect_noop: false
    }
  };

  if (project.main_type === 'local') {
    if (project.local) {
      const exhibitionData = addExhibitionEnd(project.local.exhibition);
      updateData.body.doc.local = {};
      updateData.body.doc.local.exhibition = exhibitionData;
    }
  }

  if (project.main_type === 'national') {
    const exhibitionData = addExhibitionEnd(project.national.exhibition);
    updateData.body.doc.national = {};
    updateData.body.doc.national.exhibition = exhibitionData;
  }

  if (project.main_type === 'digital_media') {
    const exhibitionData = addExhibitionEnd(project.digital_media.exhibition);
    updateData.body.doc.digital_media = {};
    updateData.body.doc.digital_media.exhibition = exhibitionData;

    if (
      project.digital_media.current_sponsors === null ||
      typeof project.digital_media.current_sponsors === 'undefined'
    ) {
      if (project.quota_quantity > 0) {
        updateData.body.doc.digital_media.isAvailable = true;
      } else {
        updateData.body.doc.digital_media.isAvailable = false;
      }
    } else if (project.quota_quantity > project.digital_media.current_sponsors.length) {
      updateData.body.doc.digital_media.isAvailable = true;
    } else {
      updateData.body.doc.digital_media.isAvailable = false;
    }
  }

  if (project.already_published === null || typeof project.already_published === 'undefined') {
    updateData.body.doc.already_published = project.published;
  }

  let priorityDate = null;

  if (siscomData) {
    const fixedSiscomData = fixSiscomQuotaData(siscomData);
    updateData.body.doc.siscom_data = fixedSiscomData;
    priorityDate = siscomPlanController.calculateEarliestPriorityDate(siscomData);
    updateData.body.doc.priorityDate = priorityDate;
    updateData.body.doc.availability = siscomData.availability;
  } else if (project.main_type === 'digital_media') {
    updateData.body.doc.availability = null;
  } else {
    updateData.body.doc.availability = UNAVAILABLE_STATUS;
  }

  if (priorityDate === null) {
    const priorityDate = calculatePriorityDate(project);
    updateData.body.doc.priorityDate = priorityDate;
  }

  return new Promise((resolve, reject) => {
    _client.update(updateData, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function fixSiscomQuotaData(siscomData) {
  return siscomPlanController.fixSiscomQuotaData(siscomData);
}
