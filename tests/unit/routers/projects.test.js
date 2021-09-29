'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');
const fs = require('fs');

//Projects
const projectNationalFull = require('../../mock/projects/projectNationalFull.json');
const projectNationalMin = require('../../mock/projects/projectNationalMin.json');
const projectNationalIntegrated = require('../../mock/projects/projectNationalIntegrated.json');
const projectLocalFull = require('../../mock/projects/projectLocalFull.json');
const projectLocalMin = require('../../mock/projects/projectLocalMin.json');
const projectDigitalFull = require('../../mock/projects/projectDigitalFull.json');
const projectDigitalMin = require('../../mock/projects/projectDigitalMin.json');
const projectNationalUpdate = require('../../mock/projects/projectNationalUpdate.json');
const projectNationalIntegratedUpdate = require('../../mock/projects/projectNationalIntegratedUpdate.json');
const projectDigitalUpdate = require('../../mock/projects/projectDigitalUpdate.json');

chai.use(chaiHttp);


describe('Project', () => {

    let url = 'http://localhost:2000/api/v1/';

    let AUTH_TOKEN_TV;
    let AUTH_TOKEN_DIGITAL;

    let projectNationalFullId;
    let projectNationalMinId;
    let projectNationalIntegratedId;
    let projectLocalFullId;
    let projectLocalMinId;
    let projectDigitalMinId;
    let projectDigitalFullId;
    let attachmentPath;

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

    it('Recents', (done) => {
        chai.request(url)
            .get('projects/recents')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });

    });

    it('Create national project with full info', (done) => {
        chai.request(url)
            .post('projects?main_type=national')
            .set('Authorization', AUTH_TOKEN_TV)
            .send(projectNationalFull)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectNationalFullId = res.body.id;
                done();
            });
    });

    it('Create national project with minimal info', (done) => {
        chai.request(url)
            .post('projects?main_type=national')
            .set('Authorization', AUTH_TOKEN_TV)
            .send(projectNationalMin)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectNationalMinId = res.body.id;
                done();
            });  
    });

    it('Create integrated national project', (done) => {
        chai.request(url)
            .post('projects?main_type=national&extra_type=digital_media')
            .set('Authorization', AUTH_TOKEN_TV)
            .send(projectNationalIntegrated)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectNationalIntegratedId = res.body.id;
                done();
            });
    });

    it('Create local project with full info', (done) => {
        chai.request(url)
            .post('projects?main_type=local')
            .set('Authorization', AUTH_TOKEN_TV)
            .send(projectLocalFull)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectLocalFullId = res.body.id;
                done();
            });
    });

    it('Create local project with minimal info', (done) => {
        chai.request(url)
            .post('projects?main_type=local')
            .set('Authorization', AUTH_TOKEN_TV)
            .send(projectLocalMin)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectLocalMinId = res.body.id;
                done();
            });
    });

    it('Create digital media project with minimal info', (done) => {
        chai.request(url)
            .post('projects?main_type=digital_media')
            .set('Authorization', AUTH_TOKEN_DIGITAL)
            .send(projectDigitalMin)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectDigitalMinId = res.body.id;
                done();
            });
    });

    it('Create digital media project with full info', (done) => {
        chai.request(url)
            .post('projects?main_type=digital_media')
            .set('Authorization', AUTH_TOKEN_DIGITAL)
            .send(projectDigitalFull)
            .end((err, res) => {
                expect(res).to.have.status(201);
                projectDigitalFullId = res.body.id;
                done();
            });
    });

    it('Check created national project with full info', (done) => {
        chai.request(url)
            .get('projects/' + projectNationalFullId)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                //Timeout to prevent access before insertion on ES
                setTimeout(() => {
                    expect(res).to.have.status(200);
                    expect(res.body.name).to.equal('testnacfull');
                    expect(res.body.quota_items.length).to.equal(2);
                    expect(res.body.main_type).to.equal('national');
                    done();
                }, 4000);
            });
    });

    it('Check created national project with minimal info', (done) => {
        chai.request(url)
            .get('projects/' + projectNationalMinId)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testnacmin');
                expect(res.body.quota_items.length).to.equal(1);
                expect(res.body.main_type).to.equal('national');
                done();
            });
    });

    it('Check created national project with digital media info', (done) => {
        chai.request(url)
            .get('projects/' + projectNationalIntegratedId)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testenacdigitalmin');
                expect(res.body.quota_items.length).to.equal(1);
                expect(res.body.main_type).to.equal('national');
                done();
            });
    });

    it('Check created local project with full info', (done) => {
        chai.request(url)
            .get('projects/' + projectLocalFullId)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testelocfull');
                expect(res.body.quota_items.length).to.equal(3);
                expect(res.body.main_type).to.equal('local');
                done();
            });
    });

    it('Check created local project with minimal info', (done) => {
        chai.request(url)
            .get('projects/' + projectLocalMinId)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testlocalmin');
                expect(res.body.quota_items.length).to.equal(0);
                expect(res.body.main_type).to.equal('local');
                done();
            });
    });

    it('Check created digital media project with minimal info', (done) => {
        chai.request(url)
            .get('projects/' + projectDigitalMinId)
            .set('Authorization', AUTH_TOKEN_DIGITAL)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testdigitalmin');
                expect(res.body.quota_items.length).to.equal(0);
                expect(res.body.main_type).to.equal('digital_media');
                done();
            });
    });

    it('Check created digital media project with full info', (done) => {
        chai.request(url)
            .get('projects/' + projectDigitalFullId)
            .set('Authorization', AUTH_TOKEN_DIGITAL)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testdigitalfull');
                expect(res.body.quota_items.length).to.equal(2);
                expect(res.body.main_type).to.equal('digital_media');
                done();
            });
    });

    it('Update Project', (done) => {
    chai.request(url)
        .put('projects/' + projectNationalFullId)
        .set('Authorization', AUTH_TOKEN_TV)
        .send(projectNationalIntegratedUpdate)
        .end((err, res) => {
            expect(res).to.have.status(204);
            done();
        });
    });   

    it('Update Project by an unauthorized user', (done) => {
    chai.request(url)
        .put('projects/' + projectDigitalMinId)
        .set('Authorization', AUTH_TOKEN_TV)
        .send(projectDigitalUpdate)
        .end((err, res) => {
            expect(res).to.have.status(403);
            done();
        });
    });    

    it('Check updated national project with full info', (done) => {
    chai.request(url)
        .get('projects/' + projectNationalFullId)
        .set('Authorization', AUTH_TOKEN_TV)
        .end((err, res) => {
            //Timeout to prevent access before insertion on ES
            setTimeout(() => {
                expect(res).to.have.status(200);
                expect(res.body.name).to.equal('testnacfull alterado');
                expect(res.body.quota_items.length).to.equal(2);
                expect(res.body.main_type).to.equal('national');
                expect(res.body.digital_media).to.equal(undefined);
                done();
            }, 7000);
        });
    });    

    it('Upload attachment', (done) => {
        chai.request(url)
            .post('projects/' + projectNationalFullId + '/upload/')
            .field('label', 'image.jpg')
            .attach('attachment', fs.readFileSync(__dirname + '/image.jpg'), 'image.jpg')
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(201);
                attachmentPath = res.body.path;
                done();
            });
    });

    it('Download attachment', (done) => {
        chai.request(url)
            .get(`projects/${projectNationalFullId}/download/${attachmentPath}`)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });    

    it('Remove attachment', (done) => {
        chai.request(url)
            .delete('projects/' + projectNationalFullId + '/attachments/' + attachmentPath)
            .set('Authorization', AUTH_TOKEN_TV)
            .end((err, res) => {
                expect(res).to.have.status(204);
                done();
            });
    });

});

