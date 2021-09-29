'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');
const grep = require('simple-grep');
const inspect = require('eyes').inspector({maxLength: 200000});

chai.use(chaiHttp);

describe('LocalSponsorship', () => {

    let url = 'http://localhost:2000/api/v1/';

    let AUTH_TOKEN_TV;
    let AUTH_TOKEN_DIGITAL;

    before((done) => {

        // Gets authorizations for a user in a tv group and a digital media group.
        // If the groups area changes any tests may return 403(forbidden), in this case, define another users
        function getAuthTv() {
            return axios.post(`${url}/login`, {"username": "teste", "password": "teste"});
        }

        function getAuthDigitalMedia() {
            return axios.post(`${url}/login`, {"username": "teste", "password": "teste"});
        }

        axios.all([getAuthTv(), getAuthDigitalMedia()])
            .then(axios.spread((authTv, authDigital) => {
                AUTH_TOKEN_TV = authTv.headers['authorization'];
                AUTH_TOKEN_DIGITAL = authDigital.headers['authorization'];
                done();
            }));

    });


    it('Upload', (done) => {
        chai.request(url)
            .post('local_sponsorships/upload')
            .query({referenceDate: '2017-04-01T00:00:00.000Z'})
            .attach('attachment', fs.readFileSync(__dirname + '/Archive-v2.zip'), 'Archive-v2.zip')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {

                let dataCrua = _.filter(res.body.bulkBody, (data) => data.name);
                let xlsParser = JSON.stringify(res.body.xlsParser);

                let flag = false;
                let camposNaoVerificados = ['siscom_data', 'attachments', 'published', 'main_type', 'created_at', 'updated_at', 'local_sponsorship'];

                _.forEach(dataCrua, (item) => {
                    Object.keys(item).forEach((attr) => {
                        if(_.findIndex(camposNaoVerificados, (o) => o === attr) < 0) {
                            let teste = xlsParser.indexOf(item[attr]);
                            // inspect(teste, `field: ${attr} indexOf: ${JSON.stringify(item[attr])}`);
                            if (teste < 0) {
                                inspect(item[attr], `termo ${attr} não encontrado`);
                                flag = true
                            }
                        }
                    });
                });

                expect(flag).to.equal(false);

                done();
            });
    });

});

