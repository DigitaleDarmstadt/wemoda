var $ = require('gulp-load-plugins')();
var argv = require('yargs').argv;
var gulp = require('gulp');
var sass = require('gulp-sass');
var minifycss = require('gulp-minify-css');

var isProduction = !!(argv.production);

var COMPATIBILITY = [
    'last 2 versions',
    'ie >= 9',
    'Android >= 2.3'
];


var PATHS = {
    sass: [
        'node_modules/foundation-sites/scss',
        'node_modules/motion-ui/src',
    ],
}

module.exports = function(config) {
	gulp.task('css', function() {

    var minifycss = $.if(isProduction, $.minifyCss());

	return gulp.src([
			config.styleBase + '**/*.scss',
		])
		.pipe($.sourcemaps.init())
        .pipe(sass({
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
		// .pipe(gulp.dest(config.staticBasePath));
		.pipe(gulp.dest('static'));
	})

	gulp.task('css:watch', function() {
		return gulp.watch('**/*.scss', {
			cwd: config.styleBase
		}, ['css']);
	});
}