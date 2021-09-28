const gulp = require('gulp');
const lambda = require('gulp-awslambda');
const zip = require('gulp-vinyl-zip');
const replacePath = require('gulp-replace-path');
const sequence = require('gulp-sequence');
const install = require('gulp-install');

gulp.task('deployLambda', function () {
  let lambda_params = {
    "Handler": "dumpPriceTable.index",
    "Runtime": "nodejs6.10",
    "Description": "Função para persistir dados da tabela de preços do SIS.COM na AWS (Elasticsearch Service)",
    "FunctionName": "dumpPriceTable",
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
  return gulp.src(['package.json'])
    .pipe(gulp.dest('publish'))
});

gulp.task('installDependencies', function () {
  return gulp.src("publish/package.json").pipe(install({ production: true }));
})

gulp.task("createZip", function () {
  return gulp.src("publish/**/*")
    .pipe(zip.dest('publish/archive.zip'));
});

gulp.task("generateFiles", sequence("getDependencies", "installDependencies"));
gulp.task("publish", sequence("generateFiles", "createZip", "deployLambda"));