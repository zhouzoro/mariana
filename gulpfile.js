var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images');
});

gulp.task('styles', function() {
    return sass('public/styles/*.sass', {
            style: 'expanded'
        })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('public/styles'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('public/styles'))
        .pipe(notify({
            message: 'Styles task complete.'
        }));
});

gulp.task('scripts', function() {
    return gulp.src('public/scripts/raw/*.js')
        //.pipe(jshint('.jshintrc'))
        //.pipe(jshint.reporter('default'))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('public/scripts'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .pipe(gulp.dest('public/scripts'))
        .pipe(notify({
            message: 'Scripts task complete.'
        }));
});

gulp.task('images', function() {
    return gulp.src('public/images/**/*')
        .pipe(cache(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('public/images'))
        .pipe(notify({
            message: 'Images task complete'
        }));
});

gulp.task('clean', function() {
    return del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img']);
});

gulp.task('watch', function() {

  // Watch .sass files
  gulp.watch('public/styles/*.sass', ['styles']);

  // Watch .js files
  gulp.watch('public/scripts/raw/*.js', ['scripts']);

  // Watch image files
  gulp.watch('public/images/*', ['images']);

});

gulp.task('watch-styles', function() {

  // Watch .scss files
  gulp.watch('public/styles/*.sass', ['styles']);

});