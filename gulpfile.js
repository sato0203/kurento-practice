const gulp = require("gulp");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const plumber = require("gulp-plumber");

gulp.task("compile", () => {
  return gulp.src(["./src/**/*.ts"])
    .pipe(plumber())
    .pipe(webpackStream(webpackConfig("development"), webpack))
    .pipe(gulp.dest("dist"))
});

//gulp.task('test',function(){
//    gulp.src("./src/test/**/*.ts",{read:false})
//    .pipe(plumber())
//    .pipe(mocha({
//        require:["espower-typescript/guess"]
//    }))
//});

gulp.task('default',['compile'])