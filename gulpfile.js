const gulp = require('gulp');
const nunjucksRender = require('gulp-nunjucks-render');
const data = require('gulp-data');
const fs = require('fs');
 
gulp.task('nunjucks', function () {
  const meta = JSON.parse(fs.readFileSync('htdocs/_nunjucks/_data/_meta.json'));
  const config = JSON.parse(fs.readFileSync('htdocs/_nunjucks/_data/_config.json'));
  const sitedata = {...config, ...meta};
  const getDataForFile = file => {
    sitedata.path.relative = file.relative.replace(/\.njk/, '\.html').replace(/index\.html/, '');
    sitedata.path.absolute = sitedata.path.domain + sitedata.path.relative;
    return sitedata;
  };
  
  return gulp.src([
      'htdocs/_nunjucks/**/*.njk',
      '!htdocs/_nunjucks/**/_*.njk'
    ])
    .pipe(data(getDataForFile))
    .pipe(nunjucksRender({
      path: ['htdocs/_nunjucks/'],
      data: sitedata,
      envOptions: {
        autoescape: false
      }
    }))
    .pipe(gulp.dest('htdocs'));
});

gulp.task('default', ['nunjucks', 'watch']);

gulp.task('watch', function () {
  gulp.watch('htdocs/_nunjucks/**/*.njk', ['nunjucks']);
});