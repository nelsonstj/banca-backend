const log = require("../helpers/log").logger;
const bodybuilder = require("bodybuilder");
const _ = require("lodash");
const DynamoClient = require("../helpers/dynamo");

const PROJECTS_TYPE = "projects";
const SISCOM_PLANS = "siscom_plans";
const PROJECT_RANGES = ["national", "local", "digital_media"];
const DEFAULT_RESULT_SIZE = 2000;
const aws = require("aws-sdk");
const config = require("config");
const esConfig = config.get("elasticsearch");
const es = require("../helpers/esOperation");
const dynamoClient = new DynamoClient();
const s3 = new aws.S3({
  endpoint: "http://" + config.get("attachments.bucket"),
  s3BucketEndpoint: true
});
const uuidV4 = require("uuid/v4");
const integracao = require("../helpers/integration");

const util = require("../helpers/util");
const siscomPlanController = require("../controllers/siscomPlan.js");

let _setAlreadyPublished = function(published, already_published) {
  log.info("ProjectController -> setAlreadyPublished");
  return already_published === false && published === true
    ? true
    : already_published;
};

/**
 * validateProjectType - Project validation helper for recents route
 *
 * @param {string} data project main_type field
 *
 * @return {boolean} true if project is valid
 */
let _validateProjectType = data => {
  log.debug("ProjectController -> validateProjectType");

  if (typeof data === "undefined") {
    return true;
  }

  switch (data) {
    case "national":
    case "local":
    case "digital_media":
      return true;
    default:
      return false;
  }
};

/**
 * queryRecentProjects - Return recent projects data
 *
 * @param {express.req} req request object
 *
 * @return {Promise<Array>} promise containing an array of recent
 * project objects
 */
let _queryRecentProjects = req => {
  log.debug("ProjectController -> queryRecentProjects");

  let bob = bodybuilder()
    .query("range", "updated_at", {
      gte: req.query.startDate,
      lte: req.query.finalDate,
      format: "yyyy-MM-dd||/M"
    })
    .andQuery("bool", "must", { term: { published: true } })
    .sort("updated_at", "desc");

  if (req.query.type) {
    bob = bob.filter("match", "main_type", req.query.type);
  }

  return es
    .search({
      index: esConfig.index,
      type: PROJECTS_TYPE,
      body: bob
        .from(0)
        .size(40)
        .build()
    })
    .then(result =>
      util.formatSearchResult(result).map(value => ({
        id: value.id,
        main_type: value.national
          ? "national"
          : value.local
            ? "local"
            : value.digital_media
              ? "digital_media"
              : "error",
        name: value.name,
        created_by: value.created_by,
        updated_at: value.updated_at,
        main_pdf: value.mainPdf || ""
      }))
    );
};

/**
 * addExhibitionEnd - Helper method to inject end field
 * at exhibition object
 *
 * @param {object} exhibition exhibition object
 *
 * @return {object} exhibition object with end field
 */
let _addExhibitionEnd = exhibition => {
  log.debug("ProjectController -> addExhibitionEnd");

  // convertion hours to milliseconds
  if (exhibition.start && _.isNumber(exhibition.duration)) {
    const milliseconds = exhibition.duration * 3600 * 1000;
    const endDate = new Date(Date.parse(exhibition.start) + milliseconds);

    return _.assign(exhibition, { end: endDate.toISOString() });
  }
  return exhibition;
};

let _searchQuery = ({ filters, bob }) => {
  log.debug("ProjectController -> searchQuery");

  //TODO Refatorar REGRA

  bob = bob || bodybuilder();

  const context = {};

  return util
    .constantListing("regions")
    .then(regions => {
      context.regions = regions;
      return util.constantListing("states");
    })
    .then(states => {
      context.states = states;
      return util.constantListing("exhibitors");
    })
    .then(exhibitors => {
      context.exhibitors = exhibitors;

      bob = _.reduce(
        filters,
        (_bob, filterValue, filterKey) => {
          if (_bob === null || typeof _bob === "undefined") {
            _bob = bob;
          }

          if (_.includes(_.keys(this.filterSpecificMapping), filterKey)) {
            return this.filterSpecificMapping[filterKey](context)(
              _bob,
              filterValue
            );
          }
          return bob;
        },
        bob
      );
      return bob;
    })
    .then(() => {
      return bob;
    });
};

/**
 * filterAvailableQuotas - Retrieve quota data that matches
 * projects' siscom information and injects at project
 *
 * @param {Array} projects an array of projects
 *
 * @return {Promise<Array>} an array of projects with quota data
 */
let _filterAvailableQuotas = projects => {
  log.debug("ProjectController -> filterAvailableQuotas");

  if (!projects || !projects.length) {
    return Promise.resolve([]);
  }

  let bob = bodybuilder();
  const terms = _.compact(projects.map(value => value.siscom_id));

  if (terms.length) {
    terms.forEach(value => {
      bob = bob.orQuery("match", "id", value);
    });
  } else {
    return Promise.resolve(projects);
  }

  // TODO Refatorar REGRA

  return es
    .search({
      index: SISCOM_PLANS,
      body: bob
        .from(0)
        .size(DEFAULT_RESULT_SIZE)
        .build()
    })
    .then(result => {
      const parsedResult = result.hits.hits;
      _.map(projects, project => {
        const quotaData = _.find(
          parsedResult,
          f => f._source.id === project.siscom_id
        );

        if (quotaData) {
          const finalData = {};
          finalData.quotas = [];

          let availableQuotas = [];

          const quotaSource = quotaData._source;
          let quotaQuantity = _.uniq(
            _.map(quotaSource.quotas, m => {
              return m.number;
            })
          ).length;

          _.map(_.groupBy(quotaSource.quotas, g => g.exhibitedAt), quotas => {
            const locationData = {};
            locationData.availableQuota = [];
            locationData.soldQuota = [];

            _.map(_.groupBy(quotas, q => q.number), quotaNumberArray => {
              let quotaInformation = _.orderBy(
                quotaNumberArray,
                "exhibitionEnd",
                "asc"
              );
              let lastQuota = _.takeRight(quotaInformation)[0];
              locationData.locatin = lastQuota.exhibitedAt;

              if (
                _isSoldQuota(
                  lastQuota.renewLimit,
                  lastQuota.exhibitionEnd,
                  quotaSource.purchaseLimitEnd
                )
              ) {
                locationData.soldQuota.push({
                  clientName: lastQuota.clientName,
                  number: lastQuota.number,
                  renewLimit: new Date(lastQuota.renewLimit),
                  exhibitionStart: new Date(lastQuota.exhibitionStart),
                  exhibitionEnd: new Date(lastQuota.exhibitionEnd)
                });
              } else {
                locationData.availableQuota.push(lastQuota.number);
                availableQuotas[lastQuota.number - 1] = true;
              }
            });

            return locationData;
          });

          finalData.quotas = data;
          finalData.quotas = _.orderBy(
            finalData.quotas,
            ["availableQuota.length", "location"],
            ["desc", "asc"]
          );

          finalData.description = quotaSource.description;
          finalData.marketType = quotaSource.marketType;
          finalData.updatedAt = quotaSource.updatedAt;

          let availableQuotaCount = availableQuotas.reduce((p, c) => {
            return c === true ? p + 1 : p;
          }, 0);

          _.assign(
            finalData,
            { availableQuotas: availableQuotaCount },
            { soldQuotas: quotaQuantity - availableQuotaCount }
          );

          return _.assign(project, { siscom_data: finalData });
        }
      });

      return projects;
    });
};

let _enviarBarramento = project => {
  return integracao.enviar(project);
};

let _filterSpecificMapping = () => {
  log.debug("ProjectController -> filterSpecificMapping");

  //TODO refatorar REGRA
  return {
    ft_project_type: () => (bob, filter) => {
      bob.query("bool", "should", [
        {
          match: {
            "national.type": filter
          }
        },
        {
          match: {
            "local.type": filter
          }
        }
      ]);
    },
    ft_gender: () => (bob, filter) => {
      bob.query("bool", "should", [
        {
          match: {
            "national.gender": filter
          }
        },
        {
          match: {
            "local.gender": filter
          }
        }
      ]);
    },
    ft_vertical: () => (bob, filter) =>
      bob.query("match", "digital_media.vertical", filter),
    ft_region: context => (bob, filter) => {
      let components = [];

      const stateIds = context.states
        .filter(state => state.region === filter)
        .map(state => state.id);
      const exhibitors = context.exhibitors.filter(exhibitor =>
        stateIds.includes(exhibitor.state)
      );

      exhibitors.forEach(value => {
        components.push({ match: { "local.exhibitors": value.id } });
      });

      return bob.query("bool", "should", components);
    },
    ft_state: context => (bob, filter) => {
      let components = [];

      const exhibitors = context.exhibitors.filter(
        exhibitor => exhibitor.state === filter
      );

      exhibitors.forEach(value => {
        components.push({ match: { "local.exhibitors": value.id } });
      });

      return bob.query("bool", "should", components);
    }
  };
};

/**
 * create - Create a project
 *
 * @param {string}   main_type project's main type
 * @param {string}   data      project data
 * @param {string}   user      creator data
 *
 * @return {Promise<projectId>} Promise containing an object
 * with project id
 */
let _create = ({ main_type, data, user }) => {
  log.debug("ProjectController -> create");
  const projectData = _.assign(data, {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: user.username,
    owner: user.group,
    main_type,
    attachments: [],
    already_published: _setAlreadyPublished(
      data.published,
      data.already_published
    )
  });

  PROJECT_RANGES.forEach(range => {
    const exhibition = _.get(projectData, `${range}.exhibition`);

    if (exhibition) {
      projectData[range].exhibition = _addExhibitionEnd(exhibition);
    }
  });

  //TODO Refatorar REGRA

  return _associateSiscomData(projectData).then(() => {
    let dynamoData = projectData;
    if (projectData["siscom_data"] !== undefined && typeof projectData["siscom_data"] !== "undefined") {
      if (_.isEmpty(projectData["siscom_data"].purchaseLimitEnd)) {
        projectData["siscom_data"].purchaseLimitEnd = null;
      } else {
        projectData["siscom_data"].purchaseLimitEnd = new Date(projectData["siscom_data"].purchaseLimitEnd).toISOString();
      }

      if (_.isEmpty(projectData["siscom_data"].purchaseLimitStart)) {
        projectData["siscom_data"].purchaseLimitStart = null;
      } else {
        projectData["siscom_data"].purchaseLimitStart = new Date(projectData["siscom_data"].purchaseLimitStart).toISOString();
      }
    }

    return new Promise(resolve => {
      es
        .create({
          index: esConfig.index,
          type: PROJECTS_TYPE,
          id: uuidV4(),
          body: dynamoData
        })
        .then(item => {
          es
            .get({
              index: esConfig.index,
              type: PROJECTS_TYPE,
              id: item._id
            })
            .then(result => {
              result._source.id = result._id;
              resolve(result._source);
            });
        });
    });
  });
};

/**
 * get - get a project with given id
 *
 * @param {string}   id           project id
 * @param {boolean}   week_day_fmt  flag to sinalize if week day fields
 * should be transformed to it's configured string representations
 *
 * @return {Promise<Project>} promise containing project data
 */
let _get = ({ id, week_day_fmt }) => {
  log.debug("ProjectController -> get");

  return es
    .get({
      index: esConfig.index,
      type: PROJECTS_TYPE,
      id
    })
    .then(result =>
      _.assign(result._source, {
        id: result._id
      })
    )
    .then(result => util.formatProgramDays(result, week_day_fmt));
};

/**
 * update - Update project identified by it's id
 *
 * @param {string}   id   project id
 * @param {object}   data data to update
 *
 * @return {Promise<>}
 */
let _update = ({ id, data }) => {
  log.debug("ProjectController -> update");

  // TODO Refatorar Regra
  let _id = id;

  const projectData = _.assign(data, {
    updated_at: new Date().toISOString(),
    already_published: _setAlreadyPublished(
      data.published,
      data.already_published
    )
  });

  PROJECT_RANGES.forEach(range => {
    const exhibition = _.get(projectData, `${range}.exhibition`);

    if (exhibition) {
      projectData[range].exhibition = _addExhibitionEnd(exhibition);
    }
  });

  return _associateSiscomData(projectData).then(() => {
    let dynamoData = projectData;
    dynamoData.id = _id;

    if (
      projectData["siscom_data"] !== undefined &&
      typeof projectData["siscom_data"] !== "undefined"
    ) {
      if (_.isEmpty(projectData["siscom_data"].purchaseLimitEnd)) {
        projectData["siscom_data"].purchaseLimitEnd = null;
      } else {
        projectData["siscom_data"].purchaseLimitEnd = new Date(
          projectData["siscom_data"].purchaseLimitEnd
        ).toISOString();
      }

      if (_.isEmpty(projectData["siscom_data"].purchaseLimitStart)) {
        projectData["siscom_data"].purchaseLimitStart = null;
      } else {
        projectData["siscom_data"].purchaseLimitStart = new Date(
          projectData["siscom_data"].purchaseLimitStart
        ).toISOString();
      }
    }

    return new Promise(resolve => {
      es
        .update({
          index: esConfig.index,
          type: PROJECTS_TYPE,
          id: dynamoData.id,
          body: {
            doc: dynamoData
          }
        })
        .then(item => {
          es
            .get({
              index: esConfig.index,
              type: PROJECTS_TYPE,
              id: item._id
            })
            .then(result => {
              result._source.id = result._id;
              resolve(result._source);
            });
        });
    });
  });
};

/**
 * addAttachment - Add an attachment to a project at elasticsearch
 *
 * @param {string}   id         Description
 * @param {object}   attachment Description
 *
 * @return {type} Description
 */
let _addAttachment = ({ id, attachment }) => {
  log.debug("ProjectController -> addAttachment");

  let dynamoData = {};
  dynamoData.id = id;

  return dynamoClient
    .read(esConfig.projeto.index, id)
    .then(data => {
      let parsedData = JSON.parse(data);
      if (!!parsedData.Item.attachments) {
        dynamoData.attachments = parsedData.Item.attachments;
        dynamoData.attachments.push(attachment);
      } else {
        dynamoData.attachments = [attachment];
      }
      return dynamoClient
        .update(esConfig.projeto.index, dynamoData)
        .then(() => attachment);
    })
    .catch(err => {
      log.error(err);
      throw err;
    });
};

/**
 * getAttachmentURL - Description
 *
 * @param {type}   bucket     Description
 * @param {type}   attachment Description
 *
 * @return {Promise} Description
 */
let _getAttachmentURL = ({ bucket, attachment }) => {
  log.debug("ProjectController -> getAttachmentURL");

  return new Promise((resolve, reject) => {
    s3.getSignedUrl(
      "getObject",
      {
        Bucket: bucket,
        Key: attachment
      },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });
};

let _updateAttachentHandler = ({ project_id, attachment }) => {
  log.debug("ProjectController -> updateAttachentHandler");

  return new Promise((resolve, reject) => {
    _get({ id: project_id })
      .then(project => {
        _.remove(project.attachments, item => item.path === attachment);
        return _update({
          id: project_id,
          data: _.pick(project, "attachments")
        }).then(result => resolve(result));
      })
      .catch(err => reject(err));
  });
};

let _calculatePriorityDate = projectData => {
  log.debug("ProjectController -> calculatePriorityDate");

  if (projectData.renew_limit_date) {
    return projectData.renew_limit_date;
  } else {
    if (projectData.national) {
      return projectData.national.exhibition.end;
    } else if (projectData.local) {
      return projectData.local.exhibition.end;
    }
  }
};

let _isSoldQuota = (renewLimit, exhibitionEnd, planPurchaseLimit) => {
  log.debug("ProjectController -> isSoldQuota");

  let evaluation = false;
  let today = new Date();

  // Se houver data de renovação, está vendido (pode ser que não tenha a data em alguns casos)
  if (renewLimit !== null && typeof renewLimit !== "undefined") {
    evaluation = evaluation || today < new Date(renewLimit);
  }

  // Se houver data de final de exibição está vendido (sem exceções)
  if (exhibitionEnd !== null && typeof exhibitionEnd !== "undefined") {
    evaluation = evaluation || today < new Date(exhibitionEnd);
  }

  return evaluation;
};

let _associateSiscomData = projectData => {
  if (projectData.siscom_id !== null && typeof projectData.siscom_id !== "undefined") {
    return siscomPlanController
      .getSiscomPlan(projectData.siscom_id)
      .then(data => {
        return new Promise((resolve, reject) => {
          projectData.priorityDate = siscomPlanController.calculateEarliestPriorityDate(
            data
          );
          projectData.availability = data.availability;
          data = siscomPlanController.fixSiscomQuotaData(data);
          projectData.siscom_data = data;
          resolve();
        });
      });
  } else {
    return new Promise(resolve => {
      resolve();
    });
  }
};

module.exports = {
  validateProjectType: _validateProjectType,
  queryRecentProjects: _queryRecentProjects,
  searchQuery: _searchQuery,
  filterAvailableQuotas: _filterAvailableQuotas,
  filterSpecificMapping: _filterSpecificMapping,
  create: _create,
  get: _get,
  update: _update,
  addAttachment: _addAttachment,
  getAttachmentURL: _getAttachmentURL,
  updateAttachentHandler: _updateAttachentHandler,
  calculatePriorityDate: _calculatePriorityDate,
  enviarBarramento: _enviarBarramento
};
