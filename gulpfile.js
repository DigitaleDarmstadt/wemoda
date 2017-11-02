var gulp = require('gulp');

var config = {
	staticBasePathCss: './styleshees/',
	staticBasePathJs: './javascript/',
	scriptBase: './javascript/',
	styleBase: './scss/',
	defaultFilename: 'wemoda',
	pkg: require('./package.json'),
	banner: '/*! WEMODA - v<%= pkg.version %>\n' +
		' * <%= pkg.homepage %>\n' +
		' * Copyright (c) ' + (new Date()).getFullYear() + ' <%= pkg.author.name %> <<%= pkg.author.email%>> */\n'
};

require('./gulp/css')(config);
// require('./gulp/javascript')(config);
//require('./gulp/clean')(config);

gulp.task('default', ['css']);

// gulp.task('default', ['css', 'javascript']);
// gulp.task('develop', ['css', 'css:watch', 'javascript:watch', 'sprite:watch'], function() {
// 	browserSync.init({
// 		ghostMode: false
// 	});
// });

