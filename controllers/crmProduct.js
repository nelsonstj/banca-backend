const log = require('../helpers/log').logger;
const _ = require('lodash');
const crmGo = require('../helpers/crm');
const config = require("config");
const cfgCrmGo = config.get("crmGo"); //config

/**
 * getAll - get all products
 *
 * @return {Promise<Array>}  promise containing an array of all products
 */
let _getAllProducts = () => {
    log.debug('CrmProductsController -> getAllProducts');
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'products',
              // select: ['name', 'productid', '_formato', 'productnumber', '_expirado', '_tipodemidia', '_pricelevelid_value'],
                filter: 'statecode eq 0',
               orderBy: ['name asc'],
                   top: 100
               // count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('CrmProductsController getAllProducts Count: ' + JSON.stringify(records.oDataCount));
            // console.log('Products Request: ' + JSON.stringify(records));
            res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getAllProducts: ' + error.message);
            reject(error)
        });
    })
};

/**
 * get - Return an product
 *
 * @param {string}   productId
 *
 * @return {Promise<>} promise containing product object
 */
let _getProductById = (req) => {
    log.debug('CrmProductsController -> getProductById');
    log.debug('CrmProductsController -> getProductById -> req: ' + JSON.stringify(req.params.id));
    let productid = req.params.id;
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'products',
              // select: ['name', 'productid', '_formato', 'productnumber', '_expirado', '_tipodemidia', '_pricelevelid_value'],
              // filter: 'productid eq ' + productid + ' and statecode eq 0',
                filter: '_idsiscomprograma eq ' + productid + ' and statecode eq 0',
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('CrmProductsController getProductById Count: ' + JSON.stringify(records.oDataCount));
            // console.log('Accounts Request: ' + JSON.stringify(records));
            if (records.oDataCount > 0) {
                res = records.value;
                resolve(res);
            } else 
                reject({msg: "Produto não encontrado no CRM ou sem associação com o Siscom."});
          }).catch(error => {
            log.error('Erro getProductById: ' + error.message);
            reject(error)
        });
    })
};

/**
 * get - Return an product
 *
 * @param {string}   name
 *
 * @return {Promise<>} promise containing product object
 */
let _getProductByName = (req) => {
    log.debug('CrmProductsController -> getProductByName');
    log.debug('CrmProductsController -> getProductByName -> req: ' + JSON.stringify(req.query.q));
    let product = req.query.q;
    log.debug('Nome: ' + product);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'products',
                // select: ['name', 'productid', '_formato', 'productnumber', '_expirado', '_tipodemidia', '_pricelevelid_value'],
                filter: 'name ne null' + 
                        ' and ' +
                        "contains(name, '" + product + "') and statecode eq 0 ",
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('CrmProductsController getProductByName Count: ' + JSON.stringify(records.oDataCount));
            // console.log('Accounts Request: ' + JSON.stringify(records));
            res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getProductByName: ' + error.message);
            reject(error)
        });
    })
};

/**
 * get - Return an product
 *
 * @param {string}   data      opportunity data
 *
 * @return {Promise<>} promise containing product object
 */
let _getProductToOpportunity = (productId) => {
    log.debug('CrmProductsController -> getProductToOpportunity');
    /*
    const prodData = _.assign(data, {
        productSisComId: data.produtoId
    });
    */
    // log.debug('CrmProductsController -> getProductToOpportunity Data: ' + JSON.stringify(prodData));
    let prodSisComId = productId; // prodData['productSisComId'];
    log.debug('productId: ' + prodSisComId);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'products',
              // select: ['name', 'productid', '_formato', 'productnumber', '_expirado', '_tipodemidia', '_pricelevelid_value'],
              // filter: 'productid eq ' + productid + ' and statecode eq 0',
              filter: '_idsiscomprograma eq ' + prodSisComId + ' and statecode eq 0',
              count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('CrmProductsController getProductToOpportunity Count: ' + JSON.stringify(records.oDataCount));
            // console.log('Accounts Request: ' + JSON.stringify(records));
            if (records.oDataCount > 0) {
                res = records.value;
                if (res[0]._pricelevelid_value === 'undefined' || res[0]._pricelevelid_value === null)
                    res[0]._pricelevelid_value = cfgCrmGo.pricelevelId.toUpperCase(); // lista de preços padrão
                resolve(res);
            } else 
                reject({type: "getProductToOpportunity"});
        }).catch(error => {
            log.error('Erro getProductToOpportunity: ' + error);
            reject(error)
        });
    })
};

module.exports = {
    getAllProducts: _getAllProducts,
    getProductById: _getProductById,
    getProductByName: _getProductByName,
    getProductToOpportunity: _getProductToOpportunity
};
