"use strict";




/* ___________________________________________________
______________________________________________________
_______________________ VARS _________________________
___________________________________________________ */

// fast path for src, build, watch, clean tasks
var path = {
    build: {
        html:  'assets/build/',
        js:    'assets/build/js/',
        css:   'assets/build/css/',
        img:   'assets/build/img/',
        fonts: 'assets/build/fonts/'
    },
    src: {
        html:  'assets/src/*.html',
        js:    'assets/src/dev_js/main.js',
        style: 'assets/src/sass/main.scss',
        img:   'assets/src/img/**/*.*',
        fonts: 'assets/src/fonts/**/*.*'
    },
    watch: {
        html:  'assets/src/**/*.html',
        js:    'assets/src/dev_js/**/*.js',
        css:   'assets/src/sass/**/*.scss',
        img:   'assets/src/img/**/*.*',
        fonts: 'assets/srs/fonts/**/*.*'
    },
    clean:     './assets/build/*'
};

// browser-sync server settings
var config = {
    server: {
        baseDir: './assets/src'
    },
    port: 8089,
		open: true,
		notify: false
};




/* ___________________________________________________
______________________________________________________
__________________ REQUIRE PLUGINS ___________________
___________________________________________________ */


// Add packages
const { src, dest, series, parallel, watch } = require('gulp');
const webserver         = require('browser-sync'), // reload browser in real time
      plumber           = require('gulp-plumber'), // for errors
      rigger            = require('gulp-rigger'), // import info from files to other files
      sourcemaps        = require('gulp-sourcemaps'), // sourcemaps for css and js
      sass              = require('gulp-sass'), // SCSS to CSS
      autoprefixer      = require('gulp-autoprefixer'),
      cleanCSS          = require('gulp-clean-css'), // minimize CSS
      uglify            = require('gulp-uglify'), // minimize JS
      cache             = require('gulp-cache'), // for cache imgs
      imagemin          = require('gulp-imagemin'), // for minimaze PNG, JPEG, GIF and SVG
      jpegrecompress    = require('imagemin-jpeg-recompress'), // for minimaze jpeg	
      pngquant          = require('imagemin-pngquant'), // for minimaze png
      del               = require('del'), // remove files and folders
      stripCssComments  = require('gulp-strip-css-comments'); // remove comments




/* ___________________________________________________
______________________________________________________
_____________________ FUNCTIONS ______________________
___________________________________________________ */


// clean

function cleanBuildFolder(cb){
	del.sync(path.clean);
	cb();
};


// !!!! 
// I REMOVE MINIMIZE AND SOURSEMAP FROM DEV PROCESS, BECAUSE COMPILATION TIME IS LONG.
// NOW FILES MINIMIZE IN BUILD COMMAND. 
// !!!!

function htmlBuild(){
	return src(path.src.html)
		     //.pipe(plumber())
         //.pipe(rigger())
         //.pipe(dest(path.src.html))
         .pipe(webserver.reload({stream: true}));
};

function cssBuild(){
	return src(path.src.style)
		     .pipe(plumber())
         .pipe(sass())
         .pipe(autoprefixer({
            overrideBrowserslist: ['last 2 versions'],
            cascade: false
         }))
         .pipe(stripCssComments({preserve: false}))
         .pipe(cleanCSS())
         .pipe(dest('assets/src/css'))
         .pipe(webserver.reload({stream: true}));
};

function jsBuild(){
	return src(path.src.js)
		     .pipe(plumber())
         .pipe(rigger())
         .pipe(dest('assets/src/js'))
         .pipe(webserver.reload({stream: true}));
};

function fontsBuild(){
  return src(path.src.fonts)
         .pipe(webserver.reload({stream: true}));
};

function imageBuild(){
  return src(path.src.img)
		      .pipe(cache(imagemin([ // compressing img
		        imagemin.gifsicle({interlaced: true}),
            jpegrecompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngquant(),
            imagemin.svgo({plugins: [{removeViewBox: false}]})
		      ])))
        .pipe(dest(path.build.img));
};


function createWebserver(cb){
	webserver(config);
	cb();
};


function watchChanges(cb){
  watch(path.watch.html, htmlBuild);
  watch(path.watch.css, cssBuild);
  watch(path.watch.js, jsBuild);
  watch(path.watch.img, imageBuild);
  watch(path.watch.fonts, fontsBuild);
	cb();
};


//
// BUILD TASK
//

function takeFile(from, to){
  return src(from)
         .pipe(dest(to));
};

function moveFiles(cb){
  takeFile(path.src.html, path.build.html);
  takeFile(path.src.img, path.build.img);
  takeFile(path.src.fonts, path.build.fonts);
  cb();
};

// MINIMIZE FILES FOR BUILD TASK
function minimizeCSS(){
  return src(path.src.style)
		     .pipe(plumber())
         .pipe(sass())
         .pipe(autoprefixer({
            overrideBrowserslist: ['last 2 versions'],
            cascade: false
         }))
         .pipe(stripCssComments({preserve: false}))
         .pipe(cleanCSS())
         .pipe(dest('assets/build/css'))
};

function minimizeJS(){
  return src('assets/src/dev_js/main.js')
         .pipe(plumber())
         .pipe(rigger())
         //.pipe(sourcemaps.init())
         .pipe(uglify())
         //.pipe(sourcemaps.write('./'))
         .pipe(dest('assets/build/js'))
};




/* ___________________________________________________
______________________________________________________
_______________________ TASKS  _______________________
___________________________________________________ */


// build files and watch changes
exports.watch = series(
  createWebserver,
  watchChanges
);


// build project to build folder
exports.build = series(
  cleanBuildFolder,
  parallel(
    minimizeCSS,
    minimizeJS
  ),
  moveFiles
);