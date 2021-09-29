const log = require('../helpers/log').logger;
const _ = require('lodash');
const config = require('config');
const moment = require('moment');
const crmGo = require('../helpers/crm');
const cfgCrmGo = config.get('crmGo'); // config
const DynamoClient = require('../helpers/dynamo');
const dynamoClient = new DynamoClient();

/**
 * create - create a opportunity
 *
 * @param {object}   data      opportunity data
 * @param {object}   product   opportunity product
 * @param {object}   usercrm   owner
 *
 * @return {Promise<opportunityId>} Promise containing an object with opportunity id
 */
let _createOpportunity = ({ data, product, usercrm }) => {
    log.info('OpportunityController -> createOpportunity');
    let prodData = _.assign(data, {});
    // log.debug('OpportunityController -> createOpportunity product: ' + JSON.stringify(product));
    // log.debug('OpportunityController -> createOpportunity usercrm: ' + usercrm[0].systemuserid.toUpperCase());
    let opportunityData = {
        name: prodData['titulo'],
        'parentaccountid@odata.bind': cfgCrmGo.webApiUrl + 'accounts(' + prodData['anuncianteId'].toUpperCase() + ')',
        'pricelevelid@odata.bind': cfgCrmGo.webApiUrl + 'pricelevel(' + product[0]._pricelevelid_value + ')',
        'transactioncurrencyid@odata.bind': cfgCrmGo.webApiUrl + 'transactioncurrencies(' + cfgCrmGo.currency.toUpperCase() + ')',
        'ownerid@odata.bind': cfgCrmGo.webApiUrl + 'systemusers(' + usercrm[0].systemuserid.toUpperCase() + ')',
        isrevenuesystemcalculated: true
    };
    if (prodData['agenciaId'] !== null && prodData['agenciaId'] !== '')
        opportunityData['_agencia@odata.bind'] = cfgCrmGo.webApiUrl + 'accounts(' + prodData['agenciaId'].toUpperCase() + ')';
    
    // log.debug("OpportunityController -> createOpportunity opportunityData: " + JSON.stringify(opportunityData));
    let res = [];
    return new Promise((resolve, reject) => {
        crmGo.dynamicsWebApi.create(opportunityData, 'opportunity', ['return=representation'])
            .then((record) => {
                log.info('CreateOpportunity OK '); // + JSON.stringify(record));
                res = record;
                resolve(res);
            })
            .catch((error) => {
                log.error('Erro CreateOpportunity: ' + error.message);
                reject(error);
            });
    });
};

/**
 * create - create a product of opportunity
 *
 * @param {object}   data             opportunity data
 * @param {object}   product          opportunity product
 * @param {object}   opportunity      opportunity data created
 *
 * @return {Promise<opportunityId>} Promise containing an id of product of opportunity
 */
let _createOpportunityProduct = ({ data, product, opportunity }) => {
    log.info('OpportunityController -> createOpportunityProduct');
    //log.debug('OpportunityController -> createOpportunityProduct opportunity: ' + JSON.stringify(opportunity));
    let midiaType = product[0]._tipodemidia == "Digital" ? "MD" : "TV";
    let productData = {
        'opportunityid@odata.bind': cfgCrmGo.webApiUrl + 'opportunities(' + opportunity.opportunityid + ')',
        'productid@odata.bind': 'products(' + product[0].productid + ')',
        quantity: 1,
        priceperunit: parseFloat(data.valorNegociado),
        'transactioncurrencyid@odata.bind': cfgCrmGo.webApiUrl + 'transactioncurrencies(' + cfgCrmGo.currency.toUpperCase() + ')',
        'uomid@odata.bind': cfgCrmGo.webApiUrl + 'uoms(' + cfgCrmGo.uoms.toUpperCase() + ')'
    };
    // log.debug("OpportunityController -> createOpportunityProduct productData: " + JSON.stringify(productData));
    let cnvDateIniString = data.periodoExibIni ? moment(data.periodoExibIni).format('YYYY-MM-DD') : moment().add(1, 'days').format('YYYY-MM-DD');
    let cnvDateFimString = data.periodoExibFim ? moment(data.periodoExibFim).format('YYYY-MM-DD') : moment(cnvDateIniString).add(90, 'days').format('YYYY-MM-DD');
    if (midiaType === 'MD') {
        let periodoDias = Math.ceil(Math.abs((new Date(cnvDateFimString)).getTime() - (new Date(cnvDateIniString)).getTime())/(1000 * 3600 * 24));
        // log.debug("OpportunityController -> periodoDias: " + periodoDias);
        productData._periododias = periodoDias;
        productData._dtinicioentrega = cnvDateIniString;
    } else {
        productData._periodoexibicao_inicio = cnvDateIniString;
        productData._periodoexibicao_termino = cnvDateFimString;
    }
    // log.debug("CreateOpportunityProduct productData: " + JSON.stringify(productData));
    let res = [];
    return new Promise((resolve, reject) => {
        crmGo.dynamicsWebApi.create(productData, 'opportunityproducts', ['return=representation'])
            .then((result) => {
                log.info('CreateOpportunityProduct OK '); // + JSON.stringify(result));
                // Add the opportunity to Dynamo
                addOpportunityDynamo(opportunity, result, data);
                res = result;
                resolve(res);
            })
            .catch((error) => {
                log.error('Erro CreateOpportunityProduct: ' + error.message);
                reject(error);
            });
    });
};

/**
 * addOpportunityDynamo - Add an opportunity to Dynamo DB
 *
 * @param {object}   opportunity Description
 * @param {object}   opportunityProduct Description
 * @param {object}   productSiscomId Description
 *
 * @return {type} Description
 */
let addOpportunityDynamo = (opportunity, product, request) => {
    log.info('OpportunityController -> addOpportunityDynamo');
    var opportunityData = {
        opportunityid: opportunity.opportunityid,
        name: opportunity.name,
        accountid: opportunity._parentaccountid_value,
        agencyid: opportunity._agencia_value,
        opportunityproductid: product.opportunityproductid,
        productid: product._productid_value,
        product_siscomid: request.productId,
        main_type: request.tipoProduto,
        valornegociado: product.priceperunity,
        create_date: moment(opportunity.createdon).format('YYYY-MM-DD hh:mm'),
        create_by: opportunity._createdby_value,
        source_from: request.origem
    } ;
    // log.debug("addOpportunityDynamo opportunityData: " + JSON.stringify(opportunityData));
    return dynamoClient.create('GoOpportunity', opportunityData)
        .then(result => {
            log.info('addOpportunityDynamo - Oferta ' + opportunityData.opportunityid + ' inserida no Dynamo');
        })
        .catch(error => {
            log.error('addOpportunityDynamo - Oferta não foi inserida no Dynamo - Erro: ' + error);
        });
};
  
/**
 * get - get count of one type opportunity
 *
 * @param {string}   main_type  Type of product
 * @param {string}   source     Description of request source
 * 
 * @return {Promise<Object>}  promise containing an Json object of count opportunities
 */
let _getOpportunitiesCount = (main_type, source) => {
    log.info('OpportunityController -> getOpportunitiesCount');
    let res = [];
    return new Promise((resolve, reject) => {
        let params = {
            FilterExpression: source ? 'main_type = :main_type AND source_from = :source' : 'main_type = :main_type',
            ExpressionAttributeValues: source ? { ':main_type' : main_type, ':source' : source } : { ':main_type' : main_type },
            Select: 'COUNT'
        };
        dynamoClient.scanner('GoOpportunity', params)
            .then((result) => {
                log.debug('getOpportunitiesCount OK ' + result);
                ret = JSON.parse(result);
                res = { 
                    MainType: main_type,
                    Quantity: ret.Count 
                };
                resolve(res);
            })
            .catch((error) => {
                log.error('Erro getOpportunitiesCount: ' + error);
                reject({type: 'getOpportunitiesCount'});
            });
    })
};

/**
 * get - get count of all types opportunities
 *
 * @param {string}   source  Description of request source
 * 
 * @return {Promise<Array>}  promise containing an array of all counts
 */
let _getAllOpportunitiesCount = (source) => {
    log.info('OpportunityController -> getAllOpportunitiesCount');
    let promises = [];
    let res = [];
    return new Promise((resolve, reject) => {
        let allTypes = [
            Local = 'local',
            National = 'national',
            Digital_media = 'digital_media',
            Local_sponsorship = 'local_sponsorship',
            National_sponsorship = 'national_sponsorship',
            Net_sponsorship = 'net_sponsorship'
        ];
        allTypes.forEach(type => {
            promises.push(
                _getOpportunitiesCount(type, source)
                    .then((response) => {
                        // log.debug("OpportunityController getAllOpportunitiesCount response: " + JSON.stringify(response));
                        res.push(response);
                    })
                    .catch((error) => {
                        log.error('Erro getAllOpportunitiesCount: ' + error);
                    })
            )
        });
        Promise.all(promises).then(() => {
            if (JSON.stringify(res) !== "[]") {
                // log.debug("OpportunityController getAllOpportunitiesCount res: " + res);
                return resolve(res);
            }
            log.error('Erro getAllOpportunitiesCount Promise.all');
            return reject({type: 'getAllOpportunitiesCount'});
        });
    })
};

/**
 * get - get count of one type opportunity
 *
 * @param {string}   product    product
 * @param {string}   q          Description of request content product, initial and final period
 * 
 * @return {Promise<Object>}  promise containing an Json object of count opportunities
 */
let _getOpportunitiesCountByProduct = (q) => {
    log.info('OpportunityController -> getOpportunitiesCountByProduct');
    let res = [];
    const dtIni = moment(q.periodoIni).format('YYYY-MM-DD hh:mm');
    const dtFim = moment(q.periodoFim).format('YYYY-MM-DD hh:mm');
    let param = {
        FilterExpression: q.periodoIni ? q.periodoFim ? 'product_siscomid = :product_siscomid AND create_date BETWEEN :dateIni AND :dateFim' : 'product_siscomid = :product_siscomid AND create_date >= :dateIni' : 'product_siscomid = :product_siscomid',
        ExpressionAttributeValues: q.periodoIni ? q.periodoFim ? { ':product_siscomid' : q.produtoId, ':dateIni' : dtIni, ':dateFim' : dtFim } : { ':product_siscomid' : q.produtoId, ':dateIni' : dtIni } : { ':product_siscomid' : q.produtoId },
        Select: 'COUNT'
    };
    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (pattern.test(q.produtoId)) {
        param = {
            FilterExpression: q.periodoIni ? q.periodoFim ? 'productid = :productid AND create_date BETWEEN :dateIni AND :dateFim' : 'productid = :productid AND create_date >= :dateIni' : 'productid = :productid',
            ExpressionAttributeValues: q.periodoIni ? q.periodoFim ? { ':productid' : q.produtoId, ':dateIni' : dtIni, ':dateFim' : dtFim } : { ':productid' : q.produtoId, ':dateIni' : dtIni } : { ':productid' : q.produtoId },
            Select: 'COUNT'
        };
    }
    // log.debug("OpportunityController getOpportunitiesCountByProduct param: " + JSON.stringify(param));
    return new Promise((resolve, reject) => {
        dynamoClient.scanner('GoOpportunity', param)
            .then((result) => {
                log.debug('getOpportunitiesCount OK ' + result);
                ret = JSON.parse(result);
                res = { 
                    ProductId: q.produtoId,
                    PeriodIni: q.periodoIni,
                    PeriodFin: q.periodoFim,
                    Quantity: ret.Count 
                };
                resolve(res);
            })
            .catch((error) => {
                log.error('Erro getOpportunitiesCountByProduct: ' + error);
                reject({type: 'getOpportunitiesCountByProduct'});
            });
    })
};

module.exports = {
  createOpportunity: _createOpportunity,
  createOpportunityProduct: _createOpportunityProduct,
  getOpportunitiesCount: _getOpportunitiesCount,
  getAllOpportunitiesCount: _getAllOpportunitiesCount,
  getOpportunitiesCountByProduct: _getOpportunitiesCountByProduct
};
