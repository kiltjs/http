# --- jstool-http

auto.install:
	@node auto-install

test: auto.install
	@node make lint

build: auto.install
	@node make build

dev: auto.install
	@node make dev

master.increaseVersion:
	git checkout master
	@git pull origin master
	@node make pkg:increaseVersion

git.increaseVersion: master.increaseVersion
	git commit -a -n -m "increased version [$(shell node make pkg:version)]"
	@git push origin master

git.updateRelease:
	git checkout release
	@git pull origin release
	@git merge --no-edit master

release: auto.install test git.increaseVersion git.updateRelease build
	@git add dist -f --all
	-git commit -n -m "updating built versions"
	@git push origin release
	@echo "\n\trelease version $(shell node make pkg:version)\n"
	@git checkout master
	npm publish
	node make gh-release

echo:
	@echo "make options: test build dev live"

# DEFAULT TASKS

.DEFAULT_GOAL := build
