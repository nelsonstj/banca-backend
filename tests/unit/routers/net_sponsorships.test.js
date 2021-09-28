'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');

chai.use(chaiHttp);

describe('Net Sponsorships ', () => {

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

    it('Get', (done) => {
        chai.request(url)
            .get('net_sponsorships')
            .query({initials: 'mavo', start_date: '2017-01-01T00:00:00.000Z', end_date: '2017-12-01T00:00:00.000Z'})
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });

    });

});

