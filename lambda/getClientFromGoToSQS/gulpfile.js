const gulp = require('gulp');
const lambda = require('gulp-awslambda');
const zip = require('gulp-zip');

gulp.task('publish', function () {
  let lambda_params = {
    "Handler": "getClientFromGoToSQS.index",
    "Runtime": "nodejs6.10",
    "Description": "Função para resgatar dados de clientes do Go (Dynamics CRM) na fila da AWS (SQS)",
    "FunctionName": "getClientFromGoToSQS",
    "Role": "arn:aws:iam::???:role/BancaLambdaRole",
    "MemorySize": 256,
    "Timeout": 300
  }

  let opts = {
    "region": "us-east-1"
  };

  return gulp.src('getClientFromGoToSQS.js')
    .pipe(zip('archive.zip'))
    .pipe(lambda(lambda_params, opts))
    .pipe(gulp.dest('.'));
});