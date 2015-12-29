
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

  var pkgActions = {
    increaseVersion: function () {
      nitro.package('bower').setVersion( nitro.package('npm').increaseVersion().version() );
    }
  };

  nitro.task('pkg', function (target) {
    if( pkgActions[target] ) {
      return pkgActions[target]();
    }

    var pkg = require('./package');
    process.stdout.write(pkg[target]);
    process.exit(0);
  });

}).run();
