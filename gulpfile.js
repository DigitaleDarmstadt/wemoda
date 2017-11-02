/**
 * Created by neko on 25.08.16.
 */

"use strict";

var $ = require('gulp-load-plugins')();
var argv = require('yargs').argv;
var gulp = require('gulp');
var merge = require('merge-stream');
var sequence = require('run-sequence');
var colors = require('colors');
var del = require('del');
var rename = require("gulp-rename");
var babel = require("gulp-babel");
var ts = require('gulp-typescript');
var debug = require('gulp-debug');

var isProduction = !!(argv.production);

var COMPATIBILITY = [
    'last 2 versions',
    'ie >= 9',
    'Android >= 2.3'
];

var PATHS = {
    sass: [
        'bower_components/foundation-sites/scss',
        'bower_components/motion-ui/src',
    ],
    javascript: [

        'bower_components/foundation-sites/what-input/what-input.js',

        'bower_components/foundation-sites/js/foundation.core.js',
        'bower_components/foundation-sites/js/foundation.util.*.js',

        'bower_components/foundation-sites/js/foundation.abide.js',
        // 'bower_components/foundation-sites/js/foundation.accordion.js',
        // 'bower_components/foundation-sites/js/foundation.accordionMenu.js',
        // 'bower_components/foundation-sites/js/foundation.drilldown.js',
        'bower_components/foundation-sites/js/foundation.dropdown.js',
        'bower_components/foundation-sites/js/foundation.dropdownMenu.js',
        // 'bower_components/foundation-sites/js/foundation.equalizer.js',
        'bower_components/foundation-sites/js/foundation.interchange.js',
        // 'bower_components/foundation-sites/js/foundation.magellan.js',
        // 'bower_components/foundation-sites/js/foundation.offcanvas.js',
        // 'bower_components/foundation-sites/js/foundation.orbit.js',
        'bower_components/foundation-sites/js/foundation.responsiveMenu.js',
        'bower_components/foundation-sites/js/foundation.responsiveToggle.js',
        'bower_components/foundation-sites/js/foundation.reveal.js',
        // 'bower_components/foundation-sites/js/foundation.slider.js',
        // 'bower_components/foundation-sites/js/foundation.sticky.js',
        'bower_components/foundation-sites/js/foundation.tabs.js',
        'bower_components/foundation-sites/js/foundation.toggler.js',
        // 'bower_components/foundation-sites/js/foundation.tooltip.js',

        'bower_components/motion-ui/motion-ui.js',

        //myscript...
        'javascript/*/*.js',
    ],
};

gulp.task('sass', function () {
    var minifycss = $.if(isProduction, $.minifyCss());

    return gulp.src('scss/app.scss')
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            includePaths: PATHS.sass
        }))
        .on('error', $.notify.onError({
            message: "<%= error.message %>",
            title: "Sass Error"
        }))
        .pipe($.autoprefixer({
            browsers: COMPATIBILITY
        }))
        .pipe(minifycss)
        .pipe($.if(!isProduction, $.sourcemaps.write('.')))
        .pipe(gulp.dest('stylesheets'));
});


gulp.task('javascript', ['typescript'], function () {
    var uglify = $.uglify()
        .on('error', $.notify.onError({
            message: "<%= error.message %>",
            title: "Uglify JS Error"
        }));

    return gulp.src(PATHS.javascript)
        .pipe($.sourcemaps.init())
        .pipe(babel())
        .pipe($.concat('app.js', {
            newLine: '\n;'
        }))
        .pipe($.if(isProduction, uglify))
        .pipe($.if(!isProduction, $.sourcemaps.write()))
        .pipe(gulp.dest('javascript'));
});
gulp.task('typescript', function () {
    return gulp.src('javascript/**/*.ts')
        .pipe(ts({
            "target": "es3",
            "module": "amd",
            "declaration": true,
            "noImplicitAny": false,
            "noResolve": true,
            "removeComments": true,
            "noLib": false,
            "emitDecoratorMetadata": true,
            "experimentalDecorators": true
        }))
        .pipe(debug())
        .pipe(gulp.dest(function(file) {
            return file.base;
        }));
});

// Build task
gulp.task('build', ['clean'], function (done) {
    sequence(['sass', 'javascript'],
        done);
});


gulp.task('clean', function (done) {
    sequence(['clean:typescript', 'clean:javascript', 'clean:css'],
        done);
});


gulp.task('clean:javascript', function () {
    return del([
        'javascript/app.js'
    ]);
});

gulp.task('clean:typescript', function () {
    return del([
        'javascript/**/*.js'
    ]);
});


gulp.task('clean:css', function () {
    return del([
        'stylesheets/app.css',
        'stylesheets/app.css.map'
    ]);
});


gulp.task('default', ['build'], function (done) {
    function logFileChange(event) {
        var fileName = require('path').relative(__dirname, event.path);
        console.log('[' + 'WATCH'.green + '] ' + fileName.yellow + ' was ' + event.type.red + ', running tasks...');
    }

    gulp.watch(['scss/**/*.scss'], ['clean:css', 'sass'])
        .on('change', function (event) {
            logFileChange(event);
        });
    gulp.watch(['javascript/**/*.ts'], ['clean:typescript','clean:javascript', 'javascript'])
        .on('change', function (event) {
            logFileChange(event);
        });
});
