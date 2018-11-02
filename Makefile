# --- jstool-http
# http://krishicks.com/post/subtree-gh-pages/

git_branch := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: install test build release

install:
	@npm install

test: install
	$(shell npm bin)/eslint src
	$(shell npm bin)/mocha --require babel-core/register tests

build: test
	$(shell npm bin)/rollup src/http-browser.js --format cjs --output dist/browser.js
	$(shell npm bin)/rollup src/http-browser.js --format umd --output dist/browser.umd.js -n \$$http
	$(shell npm bin)/rollup src/http-fetch.js --format cjs --output dist/fetch.js
	$(shell npm bin)/rollup src/http-fetch.js --format umd --output dist/fetch.umd.js -n \$$http
	$(shell npm bin)/rollup src/http-rest.js --format cjs --output dist/http-rest.js
	$(shell npm bin)/babel src/query-string.js --out-file dist/query-string.js
	cp src/http-node.js dist/http-node.js
	cp package.json dist/package.json
	cp LICENSE dist/LICENSE
	cp README.md dist/README.md

npm.increaseVersion:
	npm version patch --no-git-tag-version

npm.pushVersion: npm.increaseVersion
	git commit -a -n -m "v$(shell node -e "process.stdout.write(require('./package').version + '\n')")" 2> /dev/null; true
	git push origin $(master_branch)

git.tag: build
	git pull --tags
	git add dist -f --all
	-git commit -n -m "updating dist" 2> /dev/null; true
	git tag -a v$(shell node -e "process.stdout.write(require('./package').version + '\n')") -m "v$(shell node -e "process.stdout.write(require('./package').version + '\n')")"
	git push --tags
	# git push origin $(git_branch)

npm.publish: npm.pushVersion git.tag
	- cd dist && npm publish --access public
	- node -e "var fs = require('fs'); var pkg = require('./dist/package.json'); pkg.name = 'http-rest'; fs.writeFile('dist/package.json', JSON.stringify(pkg, null, '  '), 'utf8', function (err) { if( err ) console.log('Error: ' + err); });"
	- cd dist && npm publish
	git reset --hard origin/$(git_branch)
	@git checkout $(git_branch)

github.release: export PKG_NAME=$(shell node -e "console.log(require('./package.json').name);")
github.release: export PKG_VERSION=$(shell node -e "console.log('v'+require('./package.json').version);")
github.release: export RELEASE_URL=$(shell curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${GITHUB_TOKEN}" \
	-d '{"tag_name": "${PKG_VERSION}", "target_commitish": "$(git_branch)", "name": "${PKG_VERSION}", "body": "", "draft": false, "prerelease": false}' \
	-w '%{url_effective}' "https://api.github.com/repos/kiltjs/${PKG_NAME}/releases" )
github.release:
	@echo ${RELEASE_URL}
	@true

release: npm.publish github.release

echo:
	@echo "make options: test build dev live"

# DEFAULT TASKS

.DEFAULT_GOAL := build
