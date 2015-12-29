
require('nitro')(function (nitro) {

  nitro.task('lint', function () {

    nitro.load('src/{,**/}*.js').process('eslint');

  });

  nitro.task('dev', ['lint'], function () {

    nitro.watch('src', ['lint']);

  });

  nitro.task('build', function () {

    nitro.load('src/http-browser.js')
      .process('browserify', {
        plugins: [nitro.require('babelify')]
      })
      .process('uglify')
      .writeFile('dist/http.js')

  });

}).run();
