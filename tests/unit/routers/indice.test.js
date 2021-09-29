'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');
const fs = require('fs');
const inspect = require('eyes').inspector({maxLength: 200000});

//Projects
chai.use(chaiHttp);

describe('Indice', () => {

    let url = 'http://localhost:2000/api/v1/';

    let AUTH_TOKEN_TV;
    let AUTH_TOKEN_DIGITAL;

    before((done)=>{

        // Gets authorizations for a user in a tv group and a digital media group.
        // If the groups area changes any tests may return 403(forbidden), in this case, define another users
        function getAuthTv() {
            return axios.post(`${url}/login`, {"username": "teste","password": "teste"});
        }
        function getAuthDigitalMedia() {
            return axios.post(`${url}/login`, {"username": "teste","password": "teste"});
        }

        axios.all([getAuthTv(), getAuthDigitalMedia()])
            .then(axios.spread((authTv, authDigital) => {
                AUTH_TOKEN_TV = authTv.headers['authorization'];
                AUTH_TOKEN_DIGITAL = authDigital.headers['authorization'];
                done();
            }));

    });

    it('Upload', (done) => {
        inspect((__dirname + '/Pasta1.xlsx'),'Upload path')
        chai.request(url)
            .post('indice/upload')
            .set('Authorization', AUTH_TOKEN_TV)
            .attach('attachment', fs.readFileSync(__dirname + '/Pasta1.xlsx'), 'Pasta1.xlsx')
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Download', (done) => {
        chai.request(url)
            .get('indice/download')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

});

