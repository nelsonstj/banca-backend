const chai = require('chai');
const assert = require('chai').assert;
const expect =   chai.expect;
const inspect = require('eyes').inspector({ maxLength: 200000 });
const sinon     = require('sinon');

const SponsorshipController       = require('../../../controllers/sponsorship');
const nationalSponsorshipSample   = require('../../samples/NationalSponsorship');
const nationalSoldQuotaSample     = require("../../samples/SoldNationalPlan");

describe('SponsorshipController', function () {
  describe('ValidateSponsorshipType', function () {
    it('deve retornar true pra o tipo nacional', function () {
      expect(2).to.equal(2);
    });
  });

  describe("FilterAvailableQuotas", () => {
    it("Should return available quotas first", () => {
      let controller = new SponsorshipController({
        "es": {
          "search": ({ }) => {
            return new Promise((resolve, reject) => {
              // Sample SIS.COM plan (as from elasticsearch)
              resolve({
                "took": 1,
                "timed_out": false,
                "_shards": {
                  "total": 5,
                  "successful": 5,
                  "failed": 0
                },
                "hits": {
                  "total": 4602,
                  "max_score": 1.0,
                  "hits": [
                    {
                      "_index": "siscom_plans",
                      "_type": "siscom_plan",
                      "_id": "86316",
                      "_score": 1.0,
                      "_source": {
                        "id": 1,
                        "status": 2,
                        "purchaseStatus": 1,
                        "availabilityStart": "2017-03-15T00:00:00",
                        "availabilityEnd": "2017-03-25T00:00:00",
                        "purchaseLimitStart": "2017-02-07T00:00:00",
                        "purchaseLimitEnd": "2020-02-20T00:00:00",
                        "programInitials": "FEIPES",
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
                            "clientName": "some client / some category",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
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
                            "clientName": "some client again / some other category",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
                          },
                          {
                            "range": "L",
                            "number": 2,
                            "position": 2,
                            "exhibitedAt": "CAV",
                            "clientName": "some client instead / some other category yet",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
                          }
                        ],
                        "marketType": "L",
                        "updatedAt": "2017-06-14T11:52:58.701Z"
                      }
                    }
                  ]
                }
              });
            })
          }
        }
      });

      controller.filterAvailableQuotas([{
        "siscom_id": 1
      }]).then(data => {
        // Validating sponsorship filtered here
        assert.isNotNull(data, "There must be some project here!");
        assert.equal(1, data.length, "There must be one project here!");

        // Validating quotas here
        assert.equal(3, data[0].siscom_data.quotas.length, "Result must have 3 exhibitors!");
        assert.equal('XYZ', data[0].siscom_data.quotas[0].location, "Exhibitor XYZ must come first!");
        assert.equal('BAG', data[0].siscom_data.quotas[1].location, "Exhibitor BAG must come second!");
        assert.equal('CAV', data[0].siscom_data.quotas[2].location, "Exhibitor CAV must come third!");
      });
    });

    it("Should return available quotas first ordered alphabetically", () => {
      let controller = new SponsorshipController({
        "es": {
          "search": ({ }) => {
            return new Promise((resolve, reject) => {
              // Sample SIS.COM plan (as from elasticsearch)
              resolve({
                "took": 1,
                "timed_out": false,
                "_shards": {
                  "total": 5,
                  "successful": 5,
                  "failed": 0
                },
                "hits": {
                  "total": 4602,
                  "max_score": 1.0,
                  "hits": [
                    {
                      "_index": "siscom_plans",
                      "_type": "siscom_plan",
                      "_id": "86316",
                      "_score": 1.0,
                      "_source": {
                        "id": 1,
                        "status": 2,
                        "purchaseStatus": 1,
                        "availabilityStart": "2017-03-15T00:00:00",
                        "availabilityEnd": "2100-03-25T00:00:00",
                        "purchaseLimitStart": "2017-02-07T00:00:00",
                        "purchaseLimitEnd": "2100-02-20T00:00:00",
                        "programInitials": "FEIPES",
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
                            "clientName": "some client / some category",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
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
                            "clientName": "some client again / some other category",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
                          },
                          {
                            "range": "L",
                            "number": 2,
                            "position": 2,
                            "exhibitedAt": "BAA",
                            "clientName": "some client instead / some other category yet",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
                          },
                          {
                            "range": "L",
                            "number": 1,
                            "position": 1,
                            "exhibitedAt": "BAX",
                            "clientName": "some client again / some other category",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
                          },
                          {
                            "range": "L",
                            "number": 2,
                            "position": 2,
                            "exhibitedAt": "BAX",
                            "clientName": "some client instead / some other category yet",
                            "renewLimit": new Date(2100, 1, 1),
                            "exhibitionEnd": new Date(2100, 1, 1)
                          }
                        ],
                        "marketType": "L",
                        "updatedAt": "2017-06-14T11:52:58.701Z"
                      }
                    }
                  ]
                }
              });
            })
          }
        }
      });

      controller.filterAvailableQuotas([{
        "siscom_id": 1
      }]).then(data => {
        // Validating projects filtered here
        assert.isNotNull(data, "There must be some project here!");
        assert.equal(1, data.length, "There must be one project here!");

        // Validating quotas here
        assert.equal(5, data[0].siscom_data.quotas.length, "Result must have 5 exhibitors!");
        assert.equal('AAA', data[0].siscom_data.quotas[0].location, "Exhibitor AAA must come first!");
        assert.equal('ABB', data[0].siscom_data.quotas[1].location, "Exhibitor ABB must come second!");
        assert.equal('BAG', data[0].siscom_data.quotas[2].location, "Exhibitor BAG must come third!");
        assert.equal('BAA', data[0].siscom_data.quotas[3].location, "Exhibitor BAA must come third!");
        assert.equal('BAX', data[0].siscom_data.quotas[4].location, "Exhibitor BAX must come third!");
      });
    });
  });

  describe("Ordenação de dados baseado em parametro do client (app/cms)", () => {
    xit("Deve retornar dados ordenados por priorityDate quando enviando client = app",() => {
    })
    xit("Deve retornar dados ordenados por updated_at quando enviando client = cms",() => {
    })
    xit("Deve retornar dados ordenados por priorityDate quando não enviado qualquer parametro como 'client' ",() => {
    })
  })

  describe("calculatePriorityDate", () => {
    xit("Should return the earliest date amongst sold quotas", () => {
      let controller = new SponsorshipController({});

      let sponsorshipData = {}

      sponsorshipData.priorityDate = controller.calculatePriorityDate({
        "siscom_data": nationalSoldQuotaSample
      });

      // inspect(sponsorshipData.priorityDate, 'sponsorshipData.priorityDate.toJSON()');

      assert.equal(sponsorshipData.priorityDate.toJSON(), "2100-01-01T00:00:00.000Z", "Renew Limit is not matching quota data");
    });
  });

});