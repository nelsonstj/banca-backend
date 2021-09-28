const https     = require('https');
const xlsx      = require('node-xlsx');
const inspect = require('eyes').inspector({maxLength: 200000});


let _exec = (input) => {
    return new Promise((resolve, reject) => {
        https.get(input, response => {
            let chunks = [];
            response.on('data', chunk => chunks.push(chunk))
                .on('end', () => {
                    let book = xlsx.parse(Buffer.concat(chunks));
                    resolve(book);
                })
                .on('error', e => {
                    reject(e);
                })
        })
    })
};


module.exports = {
    exec : _exec
};



