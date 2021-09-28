const docsHelper = require('../helpers/docs');
const log 		 = require('winston');
const config 	 = require('config');

log.debug('generating docs statics');
docsHelper.generateDocsStatics({ targetPath: config.get('api_docs.target_path') })
  .then(() => {
    log.info('Documentantion generate with success');
  })
  .catch((errors) => {
    log.error('Problems while generating docs', errors);
    errors.forEach(err => log.error(err));
  });
