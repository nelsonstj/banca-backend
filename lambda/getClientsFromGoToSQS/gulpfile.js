const gulp = require('gulp');
const lambda = require('gulp-awslambda');
const zip = require('gulp-vinyl-zip');
const replacePath = require('gulp-replace-path');
const sequence = require('gulp-sequence');
const install = require('gulp-install');

gulp.task('deployLambda', function () {
  let lambda_params = {
    "Handler": "generateNetSponsorships.handler",
    "Runtime": "nodejs6.10",
    "Description": "Função para geração de dados de patrocínios de rede.",
    "FunctionName": "generateNetSponsorships",
    "Role": "arn:aws:iam::???:role/BancaLambdaRole",
    "MemorySize": 256,
    "Timeout": 300
  }

  let opts = {
    "region": "us-east-1"
  };

  return gulp.src('publish/archive.zip')
    .pipe(lambda(lambda_params, opts));
});

gulp.task("getDependencies", function () {
  return gulp.src(['../../controllers/siscomPlan.js', '../../controllers/SiscomProgramController.js', '../../controllers/SiscomPriceTableController.js', 'package.json'])
    .pipe(gulp.dest('publish'))
});

gulp.task('installDependencies', function () {
  return gulp.src("publish/package.json").pipe(install({ production: true }));
})

gulp.task("fixRequires", function () {
  return gulp.src('generateNetSponsorships.js')
    .pipe(replacePath("../../controllers/SiscomProgramController", "./SiscomProgramController.js"))
    .pipe(replacePath("../../controllers/SiscomPriceTableController", "./SiscomPriceTableController.js"))
    .pipe(replacePath("../../controllers/siscomPlan", "./siscomPlan.js"))
    .pipe(gulp.dest('publish'));
});

gulp.task("createZip", function () {
  return gulp.src("publish/**/*", { "dot": true })
    .pipe(zip.dest('publish/archive.zip'));
});

gulp.task("generateFiles", sequence("getDependencies", "fixRequires", "installDependencies"));
gulp.task("publish", sequence("generateFiles", "createZip", "deployLambda"));