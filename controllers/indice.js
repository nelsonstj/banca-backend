
const es = require('../helpers/elastic').client;
const xlsReader = require('../helpers/reader_xls');

//TODO REVER ISSO
let _corversion = (url) => {
    return new Promise((resolve, reject) => {
        xlsReader.exec(url).then((data) => {
            let _dados = data[0].data.slice(1);
            _dados.map((data) => {
                let _linha = {'sigla': data[0], 'indice': data[1]};
                es.deleteByQuery({
                    index: 'banca',
                    type: 'conversion_index',
                    body: {
                        query: {
                            match_all: {}
                        }
                    },
                }).then(() => {
                    es.index({
                        index: 'banca',
                        type: 'conversion_index',
                        body: _linha,
                    }).catch(err => reject(err));
                }).catch(err => reject(err))
            });
            resolve();
        }).catch(err => reject(err))
    })
};

module.exports = {
    corversion : _corversion
};
