const gulp = require("gulp");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const webserver = require('gulp-webserver');
const plumber = require("gulp-plumber");

gulp.task("react-compile", () => {
  return gulp.src(["./src/**/*.ts",".src/**/.tsx"])
    .pipe(plumber())
    .pipe(webpackStream(webpackConfig("development"), webpack))
    .pipe(gulp.dest("./dist"))
});

gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver({
      https :{
        key:"../keys/server.key",
        cert:"../keys/server.crt"
      },
      host: '127.0.0.1',
      livereload: true
    })
  );
});

gulp.task('watch', function() {
  ["./src/**/*.ts",".src/**/.tsx"]
  gulp.watch("./src/**/*.ts", ['react-compile'])
  gulp.watch("./src/**/*.tsx", ['react-compile'])
});

gulp.task('default',['react-compile'])
gulp.task("develop",["react-compile","watch"])