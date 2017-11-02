module.exports = function(config) {
	gulp.task('clean', function (done) {
		sequence(['clean:typescript', 'clean:javascript', 'clean:css'],
			done);
	});


	gulp.task('clean:javascript', function () {
		return del([
			[config.scriptBase + config.defaultFilename + '.js'],
		]);
	});

	gulp.task('clean:typescript', function () {
		return del([
			'javascript/**/*.js'
		]);
	});


	gulp.task('clean:css', function () {
		return del([
			[config.scriptBase + config.defaultFilename + '.css'],
			[config.scriptBase + config.defaultFilename + '.css.map']
		]);
	});
}