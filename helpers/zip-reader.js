const zipReader = require('adm-zip');
const del = require('del');
const path = require('path');

const Zip = (arquivo) => {
    return new Promise((resolve, reject) => {
        try {

            const zip = new zipReader("./" + arquivo);
            let arquivos = [];

            let zipEntries = zip.getEntries(); // an array of ZipEntry records

            if (zipEntries.length < 1) {
                reject("Arquivo vazio");
            }

            zipEntries.forEach(function (zipEntry) {
                if (!zipEntry.isDirectory) {
                    if (zipEntry.entryName.indexOf('__MACOSX') === -1) {
                        if (path.extname(zipEntry.entryName).toUpperCase() === '.XLSX' || path.extname(zipEntry.entryName) === '.XLS'){
                            arquivos.push(zipEntry.entryName);
                        }
                    }
                }
            });

            del(['./uploads/temp/*.*']).then(() => {
                zip.extractAllTo("./uploads/temp", true);
                resolve(arquivos);
            });

        } catch (err) {
            reject(err);
        }
    });
};

module.exports = Zip;
