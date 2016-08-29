
require('nitro')(function (nitro) {

  nitro.task('lint', function () {

    nitro.load('src/{,**/}*.js').process('eslint');

  });

  nitro.task('dev', ['lint'], function () {

    nitro.watch('src', ['lint']);

  });

  nitro.task('build', function () {

    nitro.load('src/http-browser.js')
      .process('browserify')
      .process('uglify')
      .writeFile('dist/http.js');

    nitro.load('src/http-json-patch.js')
      .process('browserify')
      .process('uglify')
      .writeFile('dist/http-json-patch.js');

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

  nitro.task('gh-release', function () {
    nitro.github.release( 'v' + require('../package').version, { branch: 'release' });
  });

}).run();
