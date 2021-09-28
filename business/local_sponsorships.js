const log = require('../helpers/log').logger;
const _ = require('lodash');
const httpHelper = require('../helpers/http');
const zipReader = require('../helpers/zip-reader');
const path = require('path');
const fs = require('fs');
const xlsx = require('node-xlsx');
const bluebird = require("bluebird");
const moment = require('moment');
const merge = require('merge-array-object');
const async = require('async');

//Controllers
const localSponsorshipController = require('../controllers/local_sponsorship');
const siscomPlanController = require('../controllers/siscomPlan.js');

//Business
const UserBusiness = require('./user');
const GroupBusiness = require('./group');

function LocalSponsorshipBusiness(scope) {
    this.scope = scope;
    Object.assign(LocalSponsorshipBusiness.prototype, UserBusiness.prototype);
    Object.assign(LocalSponsorshipBusiness.prototype, GroupBusiness.prototype);
}

LocalSponsorshipBusiness.prototype.zipReader = function (req) {
    log.info('LocalSponsorshipBusiness -> zipReader');
    return new Promise((resolve, reject) => {
        zipReader(req.file.path).then((arquivos) => {
            if (arquivos.length < 1) {
                reject({type: "zipReaderEmpty", err: err});
            } else {
                this.scope.zipReaderResult = arquivos;
                resolve(this.scope)
            }
        }).catch((err) => reject({type: "zipReader", err: err}))
    });
};

LocalSponsorshipBusiness.prototype.excelDirTransversing = function () {
    log.info('LocalSponsorshipBusiness -> excelDirTransversing');
    return new Promise((resolve, reject) => {
        let excelFiles = [];
        fs.readdir('./uploads/temp/', (err, files) => {
            if (err) {
                reject({type: "excelDirTransversing", err: err});
            }
            files.map(function (file) {
                return path.join('./uploads/temp/', file);
            }).filter(function (file) {
                return fs.statSync(file).isFile();
            }).forEach(function (file) {
                if (path.extname(file) === '.xlsx' || path.extname(file) === '.xls') {
                    excelFiles.push(file)
                }
            });
            this.scope.excelFilesResult = excelFiles;
            resolve(excelFiles);
        });
    })
};

LocalSponsorshipBusiness.prototype.handlerExcelFile = function (req) {
    log.info('LocalSponsorshipBusiness -> trataExcelFileResult');
    return new Promise((resolve, reject) => {
        let dataReferencia = moment.utc(req.query.referenceDate).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
        bluebird.map(this.scope.excelFilesResult, (cadaArquivo) => {
            return this.dataWorkSheetFromFile(cadaArquivo, this.scope).then((excelData) => {
                return parseLocalSponsorshipFromWorksheet(excelData, dataReferencia).then((retorno) => {
                    return retorno;
                }).catch((err) => {
                    log.error(err);
                    reject({type: "handlerExcelFile._parseData_v2", err: err})
                })
            }).catch((err) => reject({type: "handlerExcelFile._dataWorkSheetFromFile", err: err}))
        }).then((dados) => {
            this.scope.handlerExcelFileResult = dados;
            resolve(this.scope);
        }).catch((err) => reject({type: "handlerExcelFile.bluebird", err: err}))
    })
};

LocalSponsorshipBusiness.prototype.mergeData = function () {
    log.info('LocalSponsorshipBusiness -> mergeData');
    return new Promise((resolve) => {
        this.scope.mergeDataResult = _mergeData_v2(this.scope.handlerExcelFileResult);
        resolve(this.scope);
    })
};

LocalSponsorshipBusiness.prototype.siscomData = function () {
    log.info('LocalSponsorshipBusiness -> siscomData');
    return new Promise((resolve, reject) => {
          const requests = [];

          this.scope.mergeDataResult.forEach((valor) => {
            requests.push(siscomPlanController.getSiscomPlans(valor.local_sponsorship.program_initials, 'L'));
          });

          Promise.all(requests).then((items) => {
             this.scope.mergeDataResult.map((item, index)=>{
              item.siscom_data = siscomPlanController.fixSiscomQuotaData(items[index][0]);

              if(index === this.scope.mergeDataResult.length -1) {
                  resolve(this.scope.mergeDataResult)
              }
            });
          })
    })
};

LocalSponsorshipBusiness.prototype.getAllLocalSponsorship = function () {
    log.info('SponsorshipBusiness -> getAllLocalSponsorship');
    return new Promise((resolve, reject) => {
        localSponsorshipController.getAll().then((result) => {
            this.scope.getAllLocalSponsorshipResult = result;
            resolve(this.scope);
        }).catch((err) => {
            if (err !== undefined && err.status === 404) {
                reject({type: "getNotFound"});
            } else {
                reject({type: "getAllLocalSponsorship", err: err})
            }
        })
    });
};

LocalSponsorshipBusiness.prototype.preparaBulk = function () {
    log.info('SponsorshipBusiness -> prepareBulk');
    return new Promise((resolve) => {
        let _pratrociniosInserir = [];
        let _dadosAntigos = [];
        return localSponsorshipController.isData().then((data) => {
            let _antigo = data.hits.hits;
            if (_antigo) {
                _antigo.forEach((elemento) => {
                    elemento = _.omit(elemento, ['_index', '_type', '_id']);
                    elemento = elemento._source;
                    _dadosAntigos.push(elemento);
                });
            }
            let _achou = _antigo.length > 0;
            if (!_achou) {
                this.scope.mergeDataResult.map((cadaPatrocinio) => {
                    _pratrociniosInserir.push({index: {_index: 'banca', _type: 'local_sponsorships'}});
                    _pratrociniosInserir.push(cadaPatrocinio);
                });
                this.scope.prepareBulkResult = _pratrociniosInserir;
                resolve(this.scope);
            } else {
                this.scope.prepareBulkResult = localSponsorshipController.updateData(_dadosAntigos, this.scope.mergeDataResult);
                this.scope.prepareBulkResult.map((cadaPatrocinio) => {
                    _pratrociniosInserir.push({index: {_index: 'banca', _type: 'local_sponsorships'}});
                    _pratrociniosInserir.push(cadaPatrocinio);
                });
                this.scope.prepareBulkResult = _pratrociniosInserir;
                localSponsorshipController.deleteData();
                resolve(this.scope);
            }
        });
    });
};

LocalSponsorshipBusiness.prototype.executaBulk = function () {
    log.info('LocalSponsorshipBusiness -> executaBulk');
    return new Promise((resolve, reject) => {
        localSponsorshipController.bulk({body: this.scope.prepareBulkResult}).then((response) => {
            this.scope.bulkResponseResult = response;
            resolve(this.scope);
        }).catch((err) => reject({type: "executaBulk", err: err}));
    });
};


LocalSponsorshipBusiness.prototype.integracaoEnviar = function () {
  log.info('LocalSponsorshipBusiness -> integracaoEnviar');
  return new Promise((resolve, reject) => {
    localSponsorshipController.enviarBarramento(this.scope.bulkResponseResult)
     .then(() => { resolve(this.scope); })
     .catch((err) => { reject({ type: 'integracaoEnviar', err: err }); });
  });
};

LocalSponsorshipBusiness.prototype.getLocalSponsorship = function (req) {
    log.info('LocalSponsorshipBusiness -> get');
    let _id = req.params.id;

    return new Promise((resolve, reject) => {
        localSponsorshipController.get({
            id: _id,
        }).then((localSponsorship) => {
            this.scope.getLocalSponsorshipResult = localSponsorship;
            resolve(this.scope);
        }).catch((err) => {
            if (err !== undefined && err.status === 404) {
                reject({type: "getLocalSponsorshipNotFound"});
            } else {
                reject({type: "getLocalSponsorship", err: err})
            }
        })
    });
};

LocalSponsorshipBusiness.prototype.enviarResposta = function (res, status, msg) {
  log.info('LocalSponsorshipBusiness -> enviarResposta');
  return new Promise((resolve) => {
      res.status(status).json(msg);
      resolve(this.scope);
  })
};

LocalSponsorshipBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        case 'zipReaderEmpty':
            httpHelper.notFoundResponse(res);
            break;
        case 'handlerExcelFile.parseData_v2':
            httpHelper.responseForStatus(400);
            break;
        case 'getLocalSponsorshipNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'handlerExcelFile._dataWorkSheetFromFile':
            httpHelper.responseForStatus(400);
            break;
        default:
            httpHelper.errorResponse(res);
    }
};

LocalSponsorshipBusiness.prototype.dataWorkSheetFromFile = (file, scope) => new Promise((resolve, reject) => {
    log.info('dataWorkSheetFromFile');
    const workSheetsFromFile = xlsx.parse(fs.readFileSync(path.normalize(file)));
    log.info(workSheetsFromFile[0].name);
    reject("Arquivo excel com erro");
    if (workSheetsFromFile[0].name === "Menu") {
        scope.mapa[file] = workSheetsFromFile[0];
        resolve(workSheetsFromFile[0]);
    } else {
        reject("Arquivo excel com erro");
    }
});

const _convertLocalSponsorshipDigitalMedia_v2 = (digitalMedia) => {
    let convertedDigitalMedia = [];

    _.forEach(_.groupBy(digitalMedia, 'type'), (value, key) => {
        let digitalObject = {};
        let exhibitors = "";
        _.forEach(value, item => {
            exhibitors += item.exhibitor + ' ';
        });
        exhibitors = exhibitors.split(/[ ,]+/).join(',');
        digitalObject.exhibitors = exhibitors.substring(0, _.size(exhibitors) - 1);
        digitalObject.type = key;
        convertedDigitalMedia.push(digitalObject);
    });

    return convertedDigitalMedia;
};

// TODO REFATORAR NOME E IMPLEMENTACAO
const _mergeData_v2 = function (excelData) {
    let _todosProgramas = _deepFlatten(excelData);
    let _resultado = [];

    _todosProgramas.forEach((element) => {
        element.name = element.name.trim();
    });

    // MODO 1
    if(_todosProgramas && _todosProgramas.length > 0){
        _todosProgramas.reduce((valorAnterior, valorAtual) => {
            if (valorAnterior && !_.findKey(_resultado, {'name': valorAnterior.name})) {
                _resultado.push(valorAnterior);
            }
            if (!_.findKey(_resultado, {'name': valorAtual.name})) {
                _resultado.push(valorAtual);
            } else {
                let _indice = _resultado.findIndex(p => p.name === valorAtual.name);
                _resultado[_indice] = merge(_resultado[_indice], valorAtual);
                _resultado[_indice].local_sponsorship.exhibitors_info.commercial_scheme = _.uniqBy(_resultado[_indice].local_sponsorship.exhibitors_info.commercial_scheme, 'type');
            }
        });
    }

    _todosProgramas.forEach((valor, indice, array) => {
        let uniqDigitalMedia = _.uniqBy(array[indice].digital_media.formats, 'exhibitor');
        array[indice].local_sponsorship.digital_media = _convertLocalSponsorshipDigitalMedia_v2(uniqDigitalMedia);
        delete array[indice].digital_media;
        array[indice].created_at = new Date();
        array[indice].updated_at = new Date();
    });
    return _resultado;
};

let _deepFlatten = (arr) => {
    return _flatten(
        arr.map(x =>
            Array.isArray(x)
                ? _deepFlatten(x)
                : x
        )
    )
};

let _flatten = (arr) => {
    return [].concat(...arr)
};

const parseLocalSponsorshipFromWorksheet = (excelData, dataReferencia) => new Promise((resolve, reject) => {
    try {
        let linhas = [];
        let diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Seg/Sex', 'Seg/Sáb', 'Sáb'];
        let digital_media_formato = [];
        let digital_media_internet = [];

        const DIA = 9;
        const HORARIO = 10;
        const GENERO = 11;
        const SIGLA = 12;
        const PROGRAMA = 13;
        const COTAS = 14;
        const LINHA_DIGITAL_MEDIA = 45;
        const LINHA_LABEL_EXIBIDORA = 16;

        excelData.data.forEach(function (element, index, array) {

            array[index] = array[index].map(function (cadaElemento) {
                return _sanitizeData(cadaElemento);
            });

            console.dir(array);

            let exhibitors_info = [];

            if (diasDaSemana.indexOf(array[index][DIA]) !== -1 && (index >= 18 && index <= 31)) {

                // exhibitors_info
                let _prices = [];

                for (let COLUNA_LABEL_EXIBIDORA = 23; COLUNA_LABEL_EXIBIDORA <= 37; COLUNA_LABEL_EXIBIDORA++) {
                    _filterExhibitorData(array, LINHA_LABEL_EXIBIDORA, COLUNA_LABEL_EXIBIDORA, dataReferencia, index, PROGRAMA, _prices, exhibitors_info);
                }

                _removeExhibitorDuplicates(exhibitors_info);

                let localSponsorship = _buildLocalSponsorshipObject(array, index, PROGRAMA, COTAS, dataReferencia, SIGLA, DIA, HORARIO, GENERO, exhibitors_info);


                linhas.push(localSponsorship);
            }

            // digital_media_internet
            if (diasDaSemana.indexOf(array[index][DIA]) !== -1 && (index >= 47 && index <= 63)) {
                for (let COLUNA_MIDIA_DIGITAL = 20; COLUNA_MIDIA_DIGITAL <= 33; COLUNA_MIDIA_DIGITAL++) {
                    _buildDigitalMediaObject(array, LINHA_DIGITAL_MEDIA, COLUNA_MIDIA_DIGITAL, index, digital_media_internet, dataReferencia, digital_media_formato);
                }
            }
        });

        linhas.forEach(function (elementLinhas) {
            elementLinhas.local_sponsorship.exhibitors_info.forEach(function (elementExhibitor) {
                digital_media_internet.forEach(function (element_dm) {
                    elementLinhas.name = elementLinhas.name.trim();
                    element_dm.programa = element_dm.programa.trim();
                    if (elementLinhas.name.trim() === element_dm.programa.trim() && element_dm.monthlyPrice !== undefined && element_dm.monthlyPrice > 0) {
                        let _element_dm = _.clone(element_dm);
                        delete _element_dm.programa;

                        elementExhibitor.prices.forEach(function (elementPrices) {
                            if (elementExhibitor.exhibitor === element_dm.exhibitor && elementPrices.referenceDate === element_dm.referenceDate) {
                                elementPrices.digitalPrice = element_dm.monthlyPrice;
                            }
                        })
                    }
                });
            });

            digital_media_formato.forEach(function (element_dmf) {
                let _element_dmf = _.clone(element_dmf);
                if (elementLinhas.name.trim() === element_dmf.programa.trim()) {
                    elementLinhas.digital_media.formats.push(_element_dmf);
                }
            });
        });

        resolve(linhas);
    } catch (err) {
        reject(err)
    }
});

const _commercialScheme = function (array, index) {
    let _commercial_scheme = [];

    if (array[index][15] !== undefined) {
        _commercial_scheme.push({
            type: 'ABT (7")',
            value: array[index][15]
        })
    }

    if (array[index][16] !== undefined) {
        _commercial_scheme.push({
            type: 'ENC (7")',
            value: array[index][16]
        })
    }

    if (array[index][17] !== undefined) {
        _commercial_scheme.push({
            type: 'COM. 15"',
            value: array[index][17]
        })
    }

    if (array[index][18] !== undefined) {
        _commercial_scheme.push({
            type: 'COM. 30"',
            value: array[index][18]
        })
    }

    if (array[index][19] !== undefined) {
        _commercial_scheme.push({
            type: 'VINH. PASS. (7")',
            value: array[index][19]
        })
    }

    if (array[index][20] !== undefined) {
        _commercial_scheme.push({
            type: 'TOTAL DE CHAMADAS (7")',
            value: array[index][20]
        })
    }

    return _commercial_scheme;
};

const _calcStartTime = (excelNumber) => {
    let timeInMinutes = Math.round(excelNumber * 1440);
    return moment().startOf('day').add(timeInMinutes, 'm').format('HH:mm');
};

const removeAspasSimples = (nomePrograma) => {
    let posicao = nomePrograma.indexOf("'");
    if (posicao > -1) {
        return nomePrograma.substr(0, posicao);
    } else {
        return nomePrograma
    }
};

const _sanitizeData = (data) => {
    return _filtroGuedesConsulta(_filtroGuedesVazio(data));
};

const _filtroGuedesConsulta = (data) => {
    const _sobConsulta = ['*'];
    return _sobConsulta.indexOf(data) === -1 ? data : -1;
};

const _filtroGuedesVazio = (data) => {
    const _vazios = ['-', '', 0];
    return _vazios.indexOf(_.trim(data)) === -1 ? data : undefined;
};

const _buildDigitalMediaObject = function _buildDigitalMediaObject(array, LINHA_DIGITAL_MEDIA, COLUNA_MIDIA_DIGITAL, index, digital_media_internet, dataReferencia, digital_media_formato) {
    let _exhibitor = array[LINHA_DIGITAL_MEDIA][COLUNA_MIDIA_DIGITAL];
    let _monthlyPrice = array[index][COLUNA_MIDIA_DIGITAL];
    let _nome = array[index][13];
    let _exibidora = array[index][14];
    let _formato = array[index][17];

    if (typeof(_exhibitor) !== typeof(undefined) && _exhibitor != null && _exhibitor.length > 1 && typeof(_monthlyPrice) !== typeof(undefined)) {
        digital_media_internet.push({
            programa: _nome,
            exhibitor: _exhibitor,
            referenceDate: dataReferencia,
            monthlyPrice: array[index][COLUNA_MIDIA_DIGITAL]
        });
        if(typeof(_exibidora) !== typeof(undefined) && typeof(_exibidora) == "string")
        {
            digital_media_formato.push({
                programa: _nome,
                exhibitor: _exibidora.trim(),
                type: _formato
            });
        }
    }
};

const _buildLocalSponsorshipObject = function _buildLocalSponsorshipObject(array, index, PROGRAMA, COTAS, dataReferencia, SIGLA, DIA, HORARIO, GENERO, exhibitors_info) {
    let objeto = {
        name: array[index][PROGRAMA],
        quota_quantity: array[index][COTAS],
        referenceMonth: parseInt(moment(dataReferencia).format("M"), 10)
    };
    objeto.local_sponsorship = {
        program_initials: removeAspasSimples(array[index][SIGLA]),
        program_days: array[index][DIA],
        start_time: _calcStartTime(array[index][HORARIO]),
        gender: array[index][GENERO],
        exhibitors_info: exhibitors_info
    };

    objeto.digital_media = {};
    // objeto.digital_media.priceTable 		 = [];
    objeto.digital_media.formats = [];
    // objeto.siscom_data = [];
    objeto.attachments = [];
    objeto.published = true;
    objeto.main_type = 'local_sponsorship';
    return objeto;
};

const _removeExhibitorDuplicates = function _removeExhibitorDuplicates(exhibitors_info) {
    _.map(exhibitors_info, exhibitorInfo => {
        if (exhibitorInfo.prices) {
            exhibitorInfo.prices = _.map(_.filter(exhibitorInfo.prices, price => {
                return exhibitorInfo.exhibitor === price.exhibitor;
            }), price => _.omit(price, 'exhibitor'));
            return exhibitorInfo;
        }
    });
};

const _filterExhibitorData = function _filterExhibitorData(array, LINHA_LABEL_EXIBIDORA, COLUNA_LABEL_EXIBIDORA, dataReferencia, index, PROGRAMA, _prices, exhibitors_info) {
    if (array[LINHA_LABEL_EXIBIDORA][COLUNA_LABEL_EXIBIDORA] !== undefined) {
        let _exhibitor = array[LINHA_LABEL_EXIBIDORA][COLUNA_LABEL_EXIBIDORA].trim();
        let _monthlyPrice = array[index][COLUNA_LABEL_EXIBIDORA];
        let commercial_scheme = _commercialScheme(array, index, _exhibitor);

        if (_monthlyPrice) {

            let _temp = {
                exhibitor: _exhibitor,
                referenceDate: dataReferencia,
                monthlyPrice: _monthlyPrice
            };

            _prices.push(_temp);

            exhibitors_info.push({
                exhibitor: _exhibitor,
                prices: _prices,
                commercial_scheme
            });
        }
    }
};

module.exports = LocalSponsorshipBusiness;