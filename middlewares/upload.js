const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid');
const config = require('config');
const path = require('path');
const aws = require('aws-sdk');
const bluebird = require('bluebird');
const moment = require('moment');
// const inspect = require('eyes').inspector({ maxLength: 200000 });

aws.config.update({
  secretAccessKey: config.get('aws').secretAccessKey,
  accessKeyId: config.get('aws').accessKeyId,
  region: config.get('aws').region
});

const s3 = new aws.S3({ endpoint: `http://${config.get('attachments.bucket')}`, s3BucketEndpoint: true });
const s3Action = new aws.S3();

function deleteObject({ bucket, attachment }) {
  return new Promise((resolve, reject) => {
    s3Action.deleteObject(
      {
        Bucket: bucket,
        Key: attachment
      },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });
}

function deleteIndexConversao({ bucket, noextension }) {
  const _extensoes = ['csv', 'xls', 'xlsx'].filter(extensao => extensao !== noextension.substr(-3));
  const _arquivos = _extensoes.map(extensao => `indice-de-conversao.${extensao}`);
  _arquivos.map(cadaArquivo => deleteObject({ bucket, attachment: cadaArquivo }));
}

module.exports.standard = ({ bucket, fileTable = 'noname' }) =>
  multer({
    storage: multerS3({
      s3: s3Action,
      bucket,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        // inspect(fileTable, 'fileTable: ');
        const fileTableName = fileTable === 'noname' ? uuid() : fileTable === 'merchandising' ? 'merchandising/' + moment().format('YYYYMMDD') + '_' + uuid() : fileTable;
        const filename = `${fileTableName}${path.extname(file.originalname)}`;
        req.s3_path = fileTable === 'merchandising' ? config.get('aws.s3') + '/' + bucket + '/' + filename : filename;
        if (fileTable === 'indice-de-conversao') {
          // inspect('apagou');
          deleteIndexConversao({ bucket, noextension: path.extname(file.originalname) });
        }
        cb(null, filename);
      }
    })
  });

module.exports.getAttachmentURL = function getAttachmentURL({ bucket, attachment }) {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl(
      'getObject',
      {
        Bucket: bucket,
        Key: attachment
      },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });
};

// TODO Exportar para business e controller
module.exports.getIndexConversao = function getIndexConversao({ bucket }) {
  const _extensoes = ['csv', 'xls', 'xlsx'];
  const _arquivos = _extensoes.map(extensao => `indice-de-conversao.${extensao}`);
  return bluebird
    .props({
      csv: this.getAttachmentURL({ bucket, attachment: _arquivos[0] }),
      xls: this.getAttachmentURL({ bucket, attachment: _arquivos[1] }),
      xlsx: this.getAttachmentURL({ bucket, attachment: _arquivos[2] })
    })
    .then(arquivos => arquivos);
};
