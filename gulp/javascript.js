var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var argv = require('yargs').argv;
var merge = require('merge-stream');
var sequence = require('run-sequence');
var colors = require('colors');
var del = require('del');
var rename = require("gulp-rename");
var babel = require("gulp-babel");
var ts = require('gulp-typescript');
var debug = require('gulp-debug');

var isProduction = !!(argv.production);

var PATHS = {
    javascript: [

        'node_modules/foundation-sites/what-input/what-input.js',

        'node_modules/foundation-sites/js/foundation.core.js',
        'node_modules/foundation-sites/js/foundation.util.*.js',

        'node_modules/foundation-sites/js/foundation.abide.js',
        // 'node_modules/foundation-sites/js/foundation.accordion.js',
        // 'node_modules/foundation-sites/js/foundation.accordionMenu.js',
        // 'node_modules/foundation-sites/js/foundation.drilldown.js',
        'node_modules/foundation-sites/js/foundation.dropdown.js',
        'node_modules/foundation-sites/js/foundation.dropdownMenu.js',
        // 'node_modules/foundation-sites/js/foundation.equalizer.js',
        'node_modules/foundation-sites/js/foundation.interchange.js',
        // 'node_modules/foundation-sites/js/foundation.magellan.js',
        // 'node_modules/foundation-sites/js/foundation.offcanvas.js',
        // 'node_modules/foundation-sites/js/foundation.orbit.js',
        'node_modules/foundation-sites/js/foundation.responsiveMenu.js',
        'node_modules/foundation-sites/js/foundation.responsiveToggle.js',
        'node_modules/foundation-sites/js/foundation.reveal.js',
        // 'node_modules/foundation-sites/js/foundation.slider.js',
        // 'node_modules/foundation-sites/js/foundation.sticky.js',
        'node_modules/foundation-sites/js/foundation.tabs.js',
        'node_modules/foundation-sites/js/foundation.toggler.js',
        // 'node_modules/foundation-sites/js/foundation.tooltip.js',

        'node_modules/motion-ui/motion-ui.js',

        //myscript...
        'javascript/*/*.js',
    ],
};


module.exports = function(config) {
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
};