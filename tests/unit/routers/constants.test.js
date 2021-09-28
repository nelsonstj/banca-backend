'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');

//Projects
chai.use(chaiHttp);

describe('Constants', () => {

    let url = 'http://localhost:2000/api/v1/';

    let AUTH_TOKEN_TV;
    let AUTH_TOKEN_DIGITAL;

    before((done)=>{

        // Gets authorizations for a user in a tv group and a digital media group.
        // If the groups area changes any tests may return 403(forbidden), in this case, define another users
        function getAuthTv() {
            return axios.post(`${url}/login`, {"username": "eduardo.giannotto","password": "Sis.com1"});
        }
        function getAuthDigitalMedia() {
            return axios.post(`${url}/login`, {"username": "rodrigo.mynssen","password": "globo"});
        }

        axios.all([getAuthTv(), getAuthDigitalMedia()])
            .then(axios.spread((authTv, authDigital) => {
                AUTH_TOKEN_TV = authTv.headers['authorization'];
                AUTH_TOKEN_DIGITAL = authDigital.headers['authorization'];
                done();
            }));

    });

    it('GET commercial_scheme', (done) => {
        chai.request(url)
            .get('commercial_scheme')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });


    it('GET content_genders', (done) => {
        chai.request(url)
            .get('content_genders')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('GET exhibitors', (done) => {
        chai.request(url)
            .get('exhibitors')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('GET insertion_types', (done) => {
        chai.request(url)
            .get('insertion_types')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });


    it('GET market_categories', (done) => {
        chai.request(url)
            .get('market_categories')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });


    it('GET project_types', (done) => {
        chai.request(url)
            .get('project_types')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('GET regions', (done) => {
        chai.request(url)
            .get('regions')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('GET sponsorship_content_genders', (done) => {
        chai.request(url)
            .get('sponsorship_content_genders')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('GET sponsorship_quota_types', (done) => {
        chai.request(url)
            .get('sponsorship_quota_types')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('GET states', (done) => {
        chai.request(url)
            .get('states')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

});

