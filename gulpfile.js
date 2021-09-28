const gulp = require("gulp");
const clean = require("gulp-clean");
const zip = require("gulp-zip");
const fs = require("fs");
const spawn = require("cross-spawn");
const gutil = require("gulp-util");
const rename = require("gulp-rename");


const byType = folderOrFile => {
  if (fs.lstatSync(folderOrFile).isDirectory())
    return `!${folderOrFile}/**`;
  else
    return `!${folderOrFile}`;
};

const byFolder = folderOrFile => {
  return fs.lstatSync(folderOrFile).isDirectory();
};

const emptyFolder = folderOrFile => {
  if (fs.lstatSync(folderOrFile).isDirectory())
    return `!${folderOrFile}`;
};

const comments = line => line && !line.includes('#');

const bySpaces = lineName => lineName.trim();

const buildIgnore = fs
  .readFileSync('.buildignore')
  .toString()
  .split('\r\n')
  .filter(comments)
  .map(bySpaces);

const buildIgnoreFiles = buildIgnore.map(byType);
const buildIgnoreFolders = buildIgnore.filter(byFolder).map(emptyFolder);


const src = ["./**"].concat(buildIgnoreFiles, buildIgnoreFolders);

const environment = gutil.env.type ? gutil.env.type : 'local';

const envFile = {
  dev: "./config/environment/default.dev.yml",
  hml: "./config/environment/default.hml.yml",
  prd: "./config/environment/default.prd.yml",
  local: "./config/environment/default.local.yml"
};

gulp.task("clean-environments", function () {
  return gulp.src("./config/default.yml").pipe(clean());
});

gulp.task("copy-environment-file", ["clean-environments"], function () {
  return gulp
    .src(envFile[environment])
    .pipe(rename("default.yml"))
    .pipe(gulp.dest("./config"));
});

gulp.task("clean", function () {
  return gulp.src("build.zip").pipe(clean());
});

gulp.task("run", ["copy-environment-file"], function () {
  spawn("nodemon", ["app.js"], { stdio: "inherit" });
});

gulp.task("build", ["clean", "copy-environment-file"], function () {
  return gulp
    .src(src)
    .pipe(zip("build.zip"))
    .pipe(gulp.dest("."));
});
