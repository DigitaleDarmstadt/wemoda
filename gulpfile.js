"use strict";

var $ = require('gulp-load-plugins')();
// var argv = require('yargs').argv;
var gulp = require('gulp');
// var merge = require('merge-stream');
var sequence = require('run-sequence');
// var colors = require('colors');
// var del = require('del');
// var rename = require("gulp-rename");
// var babel = require("gulp-babel");
// var ts = require('gulp-typescript');
// var debug = require('gulp-debug');

var config = {
	staticBasePathCss: './stylesheets/',
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
require('./gulp/javascript')(config);
require('./gulp/clean')(config);

gulp.task('build', ['clean'], function (done) {
    sequence(['css', 'javascript'],
        done);
});

gulp.task('default', ['build'], function (done) {
    function logFileChange(event) {
        var fileName = require('path').relative(__dirname, event.path);
        console.log('[' + 'WATCH'.green + '] ' + fileName.yellow + ' was ' + event.type.red + ', running tasks...');
    }

    gulp.watch(['scss/**/*.scss'], ['clean:css', 'css'])
        .on('change', function (event) {
            logFileChange(event);
        });
    gulp.watch(['javascript/**/*.ts'], ['clean:typescript','clean:javascript', 'javascript'])
        .on('change', function (event) {
            logFileChange(event);
        });
});

