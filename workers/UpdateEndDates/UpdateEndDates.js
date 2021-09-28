const es = require('elasticsearch');
const moment = require('moment');
const _ = require('lodash');

const HOST = "https://search-bancadev-???.us-east-1.es.amazonaws.com";
const INDEX = "banca";
const PROJECT_TYPE = "projects";

function addExhibitionEnd(exhibition) {
  // convertion hours to milliseconds
  if (exhibition.start && _.isNumber(exhibition.duration)) {
    const milliseconds = exhibition.duration * 3600 * 1000;
    const endDate = new Date(Date.parse(exhibition.start) + milliseconds);

    return _.assign(exhibition, { end: endDate.toISOString() });
  }
  
  return moment(exhibition).format("YYYY-MM-DDTHH:mm:SSS[Z]");
}

function updateEndDate() {
  let client = new es.Client({
    "host": HOST,
    "log": "error"
  });

  client.search({
    "index": INDEX,
    "type": PROJECT_TYPE,
    "body": {
      "query": {
        "match_all": {}
      },
      "size": 500
    }
  }).then(results => {
    console.log("found projects:", results.hits.hits.length);
    let promiseData = [];
    results.hits.hits.forEach((value) => {
      let projectType = value._source.main_type;

      if (projectType === "national" || projectType === "local") {
        let exhibitionEnd = addExhibitionEnd(projectType === "national" ? value._source.national.exhibition : value._source.local.exhibition);

        // promiseData.push(client.update({
        //   "index": INDEX,
        //   "type": PROJECT_TYPE,
        //   "id": value._id,
        //   "body": {
        //     "doc": {
        //       "exhibition": {
        //         "end": exhibitionEnd
        //       }
        //     }
        //   }
        // }))

        promiseData.push(projectType === "national" ? value._source.national.exhibition : value._source.local.exhibition);
      }
    });

    return new Promise((resolve, reject) => {
      resolve(promiseData);
    });

    // return Promise.All(promiseData);
  }).then((data) => {
    console.log("got data:", data);
    console.log("updated everything!");
  }).catch(err => {
    console.log("Something went wrong:", err);
  });
};

updateEndDate();