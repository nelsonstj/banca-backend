const gulp = require('gulp');
const lambda = require('gulp-awslambda');
const zip = require('gulp-zip');
const replacePath = require('gulp-replace-path');
const sequence = require('gulp-sequence');

gulp.task('deployLambda', function () {
  let lambda_params = {
    "Handler": "dumpSiscomPlans.handler",
    "Runtime": "nodejs6.10",
    "Description": "Função para persistir dados de planos do SIS.COM",
    "FunctionName": "dumpSiscomPlansDev",
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

gulp.task('node_modules', function () {
  return gulp.src('node_modules/**', { "base": "." })
    .pipe(gulp.dest('publish'));
})

gulp.task("fixRequires", function () {
  return gulp.src('dumpSiscomPlans.js')
    .pipe(replacePath("../../controllers/siscomPlan.js", "./siscomPlan.js"))
    .pipe(gulp.dest('publish'));
});

gulp.task("createZip", function () {
  return gulp.src("publish/**/*")
    .pipe(zip('publish/archive.zip'))
    .pipe(gulp.dest("."))
});

gulp.task("generateFiles", sequence("getDependencies", "fixRequires", "node_modules", "createZip"));
gulp.task("publish", sequence("generateFiles", "deployLambda"));