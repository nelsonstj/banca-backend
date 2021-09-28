'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const axios = require('axios');
const moment = require('moment');

chai.use(chaiHttp);


describe('Products', () => {

    let url = 'http://localhost:2000/api/v1/';

    let AUTH_TOKEN_TV;
    let AUTH_GROUP_TV;
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
                AUTH_GROUP_TV = authTv.data.group;
                AUTH_TOKEN_DIGITAL = authDigital.headers['authorization'];
                done();
            }));

    });

    it('Recents', (done) => {
        chai.request(url)
            .get('products/recents')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({type: 'national', startDate: '2001-01-01', finalDate: '2017-08-14'})
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    it('SearchByTerm', (done) => {
        chai.request(url)
            .get('products/search_by_term')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({q: 'futebol', ft_published: 'true', limit: '1000', offset: '0'})
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });


    it('Search', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({q: 'mavo', ft_published: 'true', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                expect(res).to.have.status(200);
                //Check if the project is published or if it's owner or holder is the current user group
                let onlyPublished = res.body.result.reduce((acc, item) => {
                                        return (item.published || item.holder === AUTH_GROUP_TV || item.owner === AUTH_GROUP_TV) && acc;
                                    }, true);
                done();
            });
    });

    it('Search filter: projects', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_product_type: 'project', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                //Possible types for projects
                let projectTypes = ['national', 'local', 'digital_media'];
                //Check product's type
                let onlyProjects = res.body.result.reduce((acc, item) => {
                                        return projectTypes.includes(item.main_type) && acc;
                                    }, true);
                expect(res).to.have.status(200);
                expect(onlyProjects).to.equal(true);
                done();
            });
    });

    it('Search filter: sponsorships', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_product_type: 'sponsorship', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                //Possible types for sponsorships
                let sponsorshipTypes = ['national_sponsorship', 'net_sponsorship', 'local_sponsorship'];
                //Check product's type
                let onlySponsorships = res.body.result.reduce((acc, item) => {
                    return sponsorshipTypes.includes(item.main_type) && acc;
                }, true);
                expect(res).to.have.status(200);
                expect(onlySponsorships).to.equal(true);
                done();
            });
    }); 

    it('Search filter: national range', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_product_range: 'national', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                //Possible types for sponsorships
                let nationalTypes = ['national_sponsorship', 'national'];
                //Check product's type
                let onlyNational = res.body.result.reduce((acc, item) => {
                                        return nationalTypes.includes(item.main_type) && acc;
                                    }, true);
                expect(res).to.have.status(200);
                expect(onlyNational).to.equal(true);
                done();
            });
    }); 

    it('Search filter: local range', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_product_range: 'local', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                //Possible types for sponsorships
                let localTypes = ['local_sponsorship', 'net_sponsorship', 'local'];
                //Check product's type
                let onlyLocal = res.body.result.reduce((acc, item) => {
                                        return localTypes.includes(item.main_type) && acc;
                                    }, true);
                expect(res).to.have.status(200);
                expect(onlyLocal).to.equal(true);
                done();
            });
    }); 

    it('Search filter: digital media range', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_product_range: 'digital_media', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                //Possible types for sponsorships
                let digitalTypes = ['digital_media'];
                //Check product's type
                let onlyDigital = res.body.result.reduce((acc, item) => {
                                        return digitalTypes.includes(item.main_type) && acc;
                                    }, true);
                expect(res).to.have.status(200);
                expect(onlyDigital).to.equal(true);
                done();
            });
    });

   
    it('Search with unknown parameters', (done) => {
    chai.request(url)
        .get('products/search_v2')
        .set('Authorization', AUTH_TOKEN_TV)
        .query({ft_nonexistent_parameter: 'aaaaaaaaa', ft_start_date: '2016-08-14', limit: '1000', offset: '0'})
        .end((err, res) => {
            expect(res).to.have.status(400);
            done();
        });
    });    

    it('Search without parameters', (done) => {
    chai.request(url)
        .get('products/search_v2')
        .set('Authorization', AUTH_TOKEN_TV)
        .query({})
        .end((err, res) => {
            expect(res).to.have.status(200);
            done();
        });
    });    

    //This test will fail until filter refactoring
    it('Search filter: unexpected value on parameter', (done) => {
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_product_type: 'invalid_value', ft_start_date: '2001-01-01', limit: '1000', offset: '0'})
            .end((err, res) => {
                console.log('This test will fail until filter refactoring');
                expect(res).to.have.status(400);
                done();
            });
    });

    it('Search filter: date range', (done) => {
        let startDate = '2017-08-01T00:00:00.000Z';
        let endDate = '2017-09-01T00:00:00.000Z';
        chai.request(url)
            .get('products/search_v2')
            .set('Authorization', AUTH_TOKEN_TV)
            .query({ft_published: 'true', ft_start_date: startDate, ft_end_date: endDate, limit: '1000', offset: '0'})
            .end((err, res) => {
                //Check product's priorityDate
                let onlyValidDates = res.body.result.reduce((acc, item) => {
                    if (item.priorityDate) {
                        //Ignore time
                        let priorityDate = moment.utc(item.priorityDate).format('YYYY-MM-DD');
                        let filterStartDate = moment.utc(startDate).format('YYYY-MM-DD');
                        let filterEndDate = moment.utc(endDate).format('YYYY-MM-DD');
                        return (moment(priorityDate).isSameOrAfter(filterStartDate, 'day') && moment(priorityDate).isSameOrBefore(filterEndDate, 'day')) && acc;
                    } else {
                        return acc;
                    }                   
                }, true);
                expect(res).to.have.status(200);
                expect(onlyValidDates).to.equal(true);
                done();
            });
    });


});

