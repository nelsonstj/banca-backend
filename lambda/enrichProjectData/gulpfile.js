const gulp = require('gulp');
const lambda = require('gulp-awslambda');
const zip = require('gulp-zip');
const replacePath = require('gulp-replace-path');
const sequence = require('gulp-sequence');
const install = require('gulp-install');

gulp.task('deployLambda', function () {
  let lambda_params = {
    "Handler": "enrichProjectData.handler",
    "Runtime": "nodejs6.10",
    "Description": "Função para sincronizar dados dos planos do SIS.COM com projetos registrados no banca.",
    "FunctionName": "enrichProjectData",
    "Role": "arn:aws:iam::???:role/BancaLambdaRole",
    "MemorySize": 256,
    "Timeout": 300
  }

  let opts = {
    "region": "us-east-1"
  };

  return gulp.src('publish/archive.zip')
    .pipe(lambda(lambda_params, opts))
    .pipe(gulp.dest("."));
});

gulp.task("getDependencies", function () {
  return gulp.src(['../../controllers/siscomPlan.js', 'package.json'])
    .pipe(gulp.dest('publish'))
});

gulp.task('installDependencies', function () {
  return gulp.src("publish/package.json").pipe(install());
})

gulp.task("fixRequires", function () {
  return gulp.src('enrichProjectData.js')
    .pipe(replacePath("../../controllers/siscomPlan.js", "./siscomPlan.js"))
    .pipe(gulp.dest('publish'));
});

gulp.task("createZip", function () {
  return gulp.src("publish/**/*")
    .pipe(zip('publish/archive.zip'))
    .pipe(gulp.dest("."))
});

gulp.task("generateFiles", sequence("getDependencies", "fixRequires"));
// gulp.task("publish", sequence("generateFiles", "deployLambda"));