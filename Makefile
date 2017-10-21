# --- jstool-http
# http://krishicks.com/post/subtree-gh-pages/

git_branch := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: install test build release

install:
	@npm install

test: install
	$(shell npm bin)/eslint src

build: test
	$(shell npm bin)/rollup src/http-browser.js --format umd --output dist/browser.js -n \$$http
	$(shell npm bin)/rollup src/http-fetch.js --format umd --output dist/fetch.js -n \$$http
	$(shell npm bin)/rollup src/wrapper.js --format cjs --output dist/wrapper.js
	cp src/http-node.js dist/http-node.js
	cp package.json dist/package.json
	cp LICENSE dist/LICENSE
	cp README.md dist/README.md

npm.version: build
	git pull --tags
	npm version patch
	git add dist -f --all
	-git commit "updating dist"
	git push --tags
	# git push origin $(git_branch)

npm.publish: npm.version build
	# -git commit "updating dist"
	# git tag -a v$(shell node -e "process.stdout.write(require('./package').version + '\n')") -m "v$(shell node -e "process.stdout.write(require('./package').version + '\n')")"
	# git reset --hard origin/$(git_branch)
	cd dist && npm publish

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
