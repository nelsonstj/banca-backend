const fs 					= require('fs');
const bluebird 				= require('bluebird');
const bootprint 			= require('bootprint');
const log 					= require('winston');
const openApi 				= require('bootprint-openapi');

const readdir 				= bluebird.promisify(fs.readdir);
const DOCS_FOLDER 			= '../docs';

bootprint.debugState 		= log.debug;

function generateDocStatic(targetPath, docPath) {
  return bootprint
          .load(openApi)
          .build(`${__dirname}/${DOCS_FOLDER}/${docPath}`,
                 `${__dirname}/../${targetPath}`)
          .generate();
}


exports.generateDocsStatics = function generateDocsStatics({ targetPath }) {
  return readdir(`${__dirname}/${DOCS_FOLDER}`)
    .then(files => Promise.all(
      files.map(f => generateDocStatic(targetPath, f))
    ));
};
