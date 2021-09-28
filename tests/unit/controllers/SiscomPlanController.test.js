const chai = require('chai');
const assert = require('chai').assert;

const siscomPlanController = require('../../../controllers/siscomPlan');
const localPlanSample = require('../../samples/localPlan');

describe("SiscomPlanController", () => {
    describe("fixSiscomQuotaData", () => {
        it("Must return a single quota", () => {
            let siscomData = localPlanSample;
            let resultData = siscomPlanController.fixSiscomQuotaData(siscomData);

            assert.isNotNull(resultData);
            assert.isTrue(resultData.availableQuotas === 1, "There must be 1 available quota when one exhibitor is available.");
            assert.isTrue(resultData.soldQuotas === 0, "A quota is only sold when every exhibitor has been sold out.");
        });

        it("Must work for a plan with many quotas", () => {
            let siscomData = {
                "updatedAt": "2017-11-10T20:11:18Z",
                "availability": 1,
                "id": 88978,
                "status": 2,
                "purchaseStatus": 3,
                "marketType": "N",
                "availabilityStart": "2018-01-01T00:00:00",
                "availabilityEnd": "2018-12-31T00:00:00",
                "purchaseLimitStart": "2017-09-04T00:00:00",
                "purchaseLimitEnd": "2017-09-26T00:00:00",
                "programInitials": "F118",
                "description": "FÃ³rmula 1 2018 - PTR",
                "restrictedSaleCode": "1",
                "queueCode": "N",
                "isAvailable": 1,
                "availalbility": 1,
                "quotas": [
                    {
                        "range": "N",
                        "number": 1,
                        "position": 1,
                        "exhibitedAt": "NAC",
                        "clientName": "CERV PETROPOLIS",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00"
                    },
                    {
                        "range": "N",
                        "number": 6,
                        "position": 6,
                        "exhibitedAt": "NAC",
                        "clientName": "BDF NIVEA LTDA",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00"
                    },
                    {
                        "range": "N",
                        "number": 4,
                        "position": 4,
                        "exhibitedAt": "NAC",
                        "clientName": "TIM BRASIL",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00"
                    },
                    {
                        "range": "N",
                        "number": 2,
                        "position": 2,
                        "exhibitedAt": "NAC",
                        "clientName": "RENAULT",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00"
                    },
                    {
                        "range": "N",
                        "number": 5,
                        "position": 5,
                        "exhibitedAt": "NAC",
                        "clientName": "CLARO DIGITAL",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00"
                    },
                    {
                        "range": "N",
                        "number": 3,
                        "position": 3,
                        "exhibitedAt": "NAC",
                        "clientName": "BCO SANTANDER",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00"
                    }
                ]
            };

            let resultData = siscomPlanController.fixSiscomQuotaData(siscomData);

            assert.isNotNull(resultData);

            assert.isTrue(resultData.availableQuotas === 0, "There must be no available quotas here!");
            assert.isTrue(resultData.soldQuotas === 6, "There is only one quota and it's sold.");
        });

        it("Must show that a quota has queue data", () => {
            let siscomData = {
                "updatedAt": "2017-11-10T20:11:18Z",
                "availability": 1,
                "id": 88978,
                "status": 2,
                "purchaseStatus": 3,
                "marketType": "N",
                "availabilityStart": "2018-01-01T00:00:00",
                "availabilityEnd": "2018-12-31T00:00:00",
                "purchaseLimitStart": "2017-09-04T00:00:00",
                "purchaseLimitEnd": "2017-09-26T00:00:00",
                "programInitials": "F118",
                "description": "Random plan",
                "restrictedSaleCode": "1",
                "queueCode": "S",
                "isAvailable": 1,
                "availalbility": 1,
                "quotas": [
                    {
                        "range": "N",
                        "number": 1,
                        "position": 1,
                        "exhibitedAt": "NAC",
                        "clientName": "CERV PETROPOLIS",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    },
                    {
                        "range": "N",
                        "number": 6,
                        "position": 6,
                        "exhibitedAt": "NAC",
                        "clientName": "BDF NIVEA LTDA",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    },
                    {
                        "range": "N",
                        "number": 4,
                        "position": 4,
                        "exhibitedAt": "NAC",
                        "clientName": "TIM BRASIL",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    },
                    {
                        "range": "N",
                        "number": 2,
                        "position": 2,
                        "exhibitedAt": "NAC",
                        "clientName": "RENAULT",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    },
                    {
                        "range": "N",
                        "number": 5,
                        "position": 5,
                        "exhibitedAt": "NAC",
                        "clientName": "CLARO DIGITAL",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    },
                    {
                        "range": "N",
                        "number": 3,
                        "position": 3,
                        "exhibitedAt": "NAC",
                        "clientName": "BCO SANTANDER",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    }
                ]
            };

            let resultData = siscomPlanController.fixSiscomQuotaData(siscomData);

            assert.isNotNull(resultData);

            assert.isTrue(resultData.availableQuotas === 0, "There must be no available quotas here!");
            assert.isTrue(resultData.soldQuotas === 6, "There six quotas here and they are sold.");
            assert.isTrue(resultData.quotas[0].location === "NAC", "This one has to be NAC!");
            assert.isTrue(resultData.quotas.length === 1, "Only one location for this one!");
            assert.isTrue(resultData.quotas[0].hasQueue === true, "This one has someone in the queue!");
        });

        it("Must show that more than one exhibitor has queue data", () => {
            let siscomData = {
                "updatedAt": "2017-11-10T20:11:18Z",
                "availability": 1,
                "id": 88978,
                "status": 2,
                "purchaseStatus": 3,
                "marketType": "L",
                "availabilityStart": "2018-01-01T00:00:00",
                "availabilityEnd": "2018-12-31T00:00:00",
                "purchaseLimitStart": "2017-09-04T00:00:00",
                "purchaseLimitEnd": "2017-09-26T00:00:00",
                "programInitials": "F118",
                "description": "Random plan",
                "restrictedSaleCode": "1",
                "queueCode": "S",
                "isAvailable": 1,
                "availalbility": 1,
                "quotas": [
                    {
                        "range": "L",
                        "number": 1,
                        "position": 1,
                        "exhibitedAt": "ACR",
                        "clientName": "CERV PETROPOLIS",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    },
                    {
                        "range": "L",
                        "number": 1,
                        "position": 1,
                        "exhibitedAt": "AXA",
                        "clientName": "",
                        "renewLimit": null,
                        "exhibitionStart": null,
                        "exhibitionEnd": null,
                        "queue": 0,
                        "queuedClients": []
                    },
                    {
                        "range": "L",
                        "number": 1,
                        "position": 1,
                        "exhibitedAt": "BEL",
                        "clientName": "TIM BRASIL",
                        "renewLimit": null,
                        "exhibitionStart": "2018-01-01T00:00:00",
                        "exhibitionEnd": "2018-12-31T00:00:00",
                        "queue": 1,
                        "queuedClients": []
                    }                    
                ]
            };

            let resultData = siscomPlanController.fixSiscomQuotaData(siscomData);

            assert.isNotNull(resultData);

            assert.isTrue(resultData.availableQuotas === 1, "There must be one available quotas here!");
            assert.isTrue(resultData.soldQuotas === 0, "Since one exhibitor is available, nothing is sold out!");
            assert.isTrue(resultData.quotas[0].location === "AXA", "This one has to be AXA since it's available!");
            assert.isTrue(resultData.quotas[1].location === "ACR", "This one has to be ACR since it's not available and because of the alphabet!");
            assert.isTrue(resultData.quotas[2].location === "BEL", "This one has to be BEL, since it's sold and the alphabet!");
            assert.isTrue(resultData.quotas.length === 3, "Three locations, must return 3 here!");
            assert.isTrue(resultData.quotas[0].hasQueue === false, "AXA should have no queue!");
            assert.isTrue(resultData.quotas[1].hasQueue === true, "ACR should have a queue!");
            assert.isTrue(resultData.quotas[2].hasQueue === true, "BEL must have a queue!");
        });
    });
});