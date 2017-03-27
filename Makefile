# --- jstool-http
# http://krishicks.com/post/subtree-gh-pages/

git_branch := $(shell git rev-parse --abbrev-ref HEAD)

install:
	@npm install

build: install
	$(shell npm bin)/rollup src/http-browser.js --format umd --output dist/browser.js -n $http
	$(shell npm bin)/rollup src/http-fetch.js --format umd --output dist/fetch.js -n $http
	$(shell npm bin)/rollup src/wrapper.js --format cjs --output dist/wrapper.js
	cp src/http-node.js dist/http-node.js

# github.release: export RELEASE_URL=$(shell curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${GITHUB_TOKEN}" \
# 	-d '{"tag_name": "v$(shell npm view http-rest version)", "target_commitish": "$(git_branch)", "name": "v$(shell npm view http-rest version)", "body": "", "draft": false, "prerelease": false}' \
# 	-w '%{url_effective}' "https://api.github.com/repos/kiltjs/http/releases" )
github.release: export RELEASE_URL=$(shell curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${GITHUB_TOKEN}" \
	-d '{"tag_name": "v$(shell npm view http-rest version)", "target_commitish": "release", "name": "v$(shell npm view http-rest version)", "body": "", "draft": false, "prerelease": false}' \
	-w '%{url_effective}' "https://api.github.com/repos/kiltjs/http/releases" )
github.release:
	@echo ${RELEASE_URL}
	@true

publish: build
	npm version patch
	cp package.json dist/package.json
	cp LICENSE dist/LICENSE
	cp README.md dist/README.md
	git add dist -f
	git push origin $(git_branch)
	cd dist && npm publish
	make github.release

echo:
	@echo "make options: test build dev live"

# DEFAULT TASKS

.DEFAULT_GOAL := build
