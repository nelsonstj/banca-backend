'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');

chai.use(chaiHttp);


describe('Groups', () => {

    let url = 'http://localhost:2000/api/v1/';

    let AUTH_TOKEN_TV;
    let AUTH_TOKEN_DIGITAL;

    let createdGroupIdTeste;

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


    it('createGroup', (done) => {
        chai.request(url)
            .post('groups')
            .set('Authorization', AUTH_TOKEN_TV)
            .send({"name": "CDAPTeste", "category": "tv"})
            .end((err, res) => {
                createdGroupIdTeste = res.body.id;
                expect(res).to.have.status(201);
                done();
            });
    });

    it('getAllGroups', (done) => {
        chai.request(url)
            .get('groups')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('getGroupActivityListFromNewGroup', (done) => {
        chai.request(url)
            .get(`groups/${createdGroupIdTeste}/activity`)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });


    it('getGroupActivityListFromExistingGroup', (done) => {
        chai.request(url)
            .get(`groups/AVynOP2H9qE2xZHAS2Cu/activity`)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });


});

