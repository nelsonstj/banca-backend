const assert = require('chai').assert;
const mocha = require('mocha');
const projectController = require('../../../controllers/project');

describe("ProjectController Tests", () => {
  describe("FilterAvailableQuotas", () => {
    describe("calculatePriorityDate", () => {
      it("Should return correct date with renew limit for national project", () => {
        let controller = new projectController({});

        let projectData = {
          "name": "Projeto teste de data",
          "description": "asdasdasdasdasd",
          "quota_quantity": 0,
          "quota_items": [
            {
              "type": 1,
              "area": "tv",
              "value": 100
            }
          ],
          "price_list": {
            "fixed_price": false
          },
          "sponsors": [],
          "renew_limit_date": "2017-09-13T00:00:00.000Z",
          "published": false,
          "siscom_id": 1022,
          "holder": "AVyDlKvX2WkQGl_DauUl",
          "holder_changed": false,
          "national": {
            "type": 2,
            "associated_to": "Programa",
            "program_days": [
              0,
              1,
              3
            ],
            "program_initials": "mavo",
            "exhibition": {
              "format": "day",
              "start": "2017-09-01T00:00:00.000Z",
              "duration": 696,
              "end": "2017-09-30T00:00:00.000Z"
            },
            "insertions": [
              {
                "type": 5,
                "value": 1
              }
            ],
            "support_media": false,
            "gender": 1,
            "has_digital_media": false
          },
          "created_at": "2017-09-08T14:08:20.252Z",
          "updated_at": "2017-09-08T14:08:20.252Z",
          "created_by": "eduardo.giannotto",
          "owner": "AVyDlKvX2WkQGl_DauUl",
          "main_type": "national",
          "attachments": [],
          "priorityDate": "2017-09-13T00:00:00.000Z",
          "id": "AV5h0emIW0c1zDVSp4en",
          "siscom_data": {
            "quotas": [
              {
                "availableQuota": [
                  1
                ],
                "soldQuota": [],
                "location": "ACR"
              }
            ],
            "description": "MAIS VOCE (8) (4)",
            "marketType": "L",
            "updatedAt": "2017-07-27T18:57:04.530Z",
            "availableQuotas": 1,
            "soldQuotas": 0
          }
        }

        let dateToCheck = controller.calculatePriorityDate(projectData);
        assert.isTrue(dateToCheck == projectData.renew_limit_date, "Date should be equal to renew_limit_date");
      });

      it("Should return correct date with exhibition date for national project", () => {
        let controller = new projectController({});

        let projectData = {
          "name": "Projeto teste de data",
          "description": "asdasdasdasdasd",
          "quota_quantity": 0,
          "quota_items": [
            {
              "type": 1,
              "area": "tv",
              "value": 100
            }
          ],
          "price_list": {
            "fixed_price": false
          },
          "sponsors": [],
          "published": false,
          "siscom_id": 1022,
          "holder": "AVyDlKvX2WkQGl_DauUl",
          "holder_changed": false,
          "national": {
            "type": 2,
            "associated_to": "Programa",
            "program_days": [
              0,
              1,
              3
            ],
            "program_initials": "mavo",
            "exhibition": {
              "format": "day",
              "start": "2017-09-01T00:00:00.000Z",
              "duration": 696,
              "end": "2017-09-30T00:00:00.000Z"
            },
            "insertions": [
              {
                "type": 5,
                "value": 1
              }
            ],
            "support_media": false,
            "gender": 1,
            "has_digital_media": false
          },
          "created_at": "2017-09-08T14:08:20.252Z",
          "updated_at": "2017-09-08T14:08:20.252Z",
          "created_by": "eduardo.giannotto",
          "owner": "AVyDlKvX2WkQGl_DauUl",
          "main_type": "national",
          "attachments": [],
          "priorityDate": "2017-09-13T00:00:00.000Z",
          "id": "AV5h0emIW0c1zDVSp4en",
          "siscom_data": {
            "quotas": [
              {
                "availableQuota": [
                  1
                ],
                "soldQuota": [],
                "location": "ACR"
              }
            ],
            "description": "MAIS VOCE (8) (4)",
            "marketType": "L",
            "updatedAt": "2017-07-27T18:57:04.530Z",
            "availableQuotas": 1,
            "soldQuotas": 0
          }
        }

        let dateToCheck = controller.calculatePriorityDate(projectData);
        assert.isTrue(dateToCheck == projectData.national.exhibition.end, "Date should be equal to exhibition end");
      });

      it("Should return correct date with renew limit for local project", () => {
        let controller = new projectController({});

        let projectData = { "name": "Projeto de teste de data local", "renew_limit_date": "2017-09-14T00:00:00.000Z", "quota_quantity": 0, "quota_items": [{ "type": "1", "area": "tv", "value": 124.14 }], "price_list": { "fixed_price": false }, "sponsors": [], "commercialization_limit": "2017-09-14T00:00:00.000Z", "published": false, "siscom_id": 1022, "holder": "AVyDlKvX2WkQGl_DauUl", "holder_changed": false, "local": { "minimum_quota": 0, "quota_quantity": 0, "exhibitors": [], "type": "2", "associated_to": "Programa", "program_days": [2, 4, 5], "program_initials": "mavo", "exhibition": { "format": "day", "start": "2017-09-01T00:00:00.000Z", "duration": 504 }, "quotas": [], "insertions": [{ "type": "11", "value": 123 }], "support_media": false, "gender": "2", "has_digital_media": false } };

        let dateToCheck = controller.calculatePriorityDate(projectData);
        assert.isTrue(dateToCheck == projectData.renew_limit_date, "Date should be equal to renew limit");
      });

      it("Should return correct date with exhibition date for local project", () => {
        let controller = new projectController({});

        let projectData = { "name": "Projeto de teste de data local", "quota_quantity": 0, "quota_items": [{ "type": "1", "area": "tv", "value": 124.14 }], "price_list": { "fixed_price": false }, "sponsors": [], "commercialization_limit": "2017-09-14T00:00:00.000Z", "published": false, "siscom_id": 1022, "holder": "AVyDlKvX2WkQGl_DauUl", "holder_changed": false, "local": { "minimum_quota": 0, "quota_quantity": 0, "exhibitors": [], "type": "2", "associated_to": "Programa", "program_days": [2, 4, 5], "program_initials": "mavo", "exhibition": { "format": "day", "start": "2017-09-01T00:00:00.000Z", "duration": 504 }, "quotas": [], "insertions": [{ "type": "11", "value": 123 }], "support_media": false, "gender": "2", "has_digital_media": false } };

        let dateToCheck = controller.calculatePriorityDate(projectData);
        assert.isTrue(dateToCheck == projectData.local.exhibition.end, "Date should be equal to exhibition end");
      });
    })
  });
});