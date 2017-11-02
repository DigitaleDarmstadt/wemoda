var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var sequence = require('run-sequence');
var del = require('del');

module.exports = function(config) {
	gulp.task('clean', function (done) {
		sequence(['clean:typescript', 'clean:javascript', 'clean:css'],
			done);
	});


	gulp.task('clean:javascript', function () {
		return del([
			'javascript/app.js',
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
}