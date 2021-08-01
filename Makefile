all: test

prepare-env:
ifeq ($(CI),true)
	npm ci --ignore-scripts
else
	npm install
endif

prepare-when-local:
ifneq ($(CI),true)
	$(MAKE) prepare-env
endif

build: prepare-when-local
	rm -rf lib/
	npx eslint --max-warnings 0 --ext js,jsx,ts,tsx src/
	npx tsc

test: prepare-when-local
ifeq ($(CI),true)
	npx jest --ci
else
	npx jest --watch
endif

deploy:
ifeq ($(GITHUB_REF),refs/heads/main)
	npx standard-version
	git push origin --tags HEAD
	npm publish
endif