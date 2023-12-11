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
	./node_modules/.bin/concurrently './node_modules/.bin/eslint --max-warnings 0 --ext js,jsx,ts,tsx src/' './node_modules/.bin/tsc --noEmit' './node_modules/.bin/tsup'

test: prepare-when-local
ifeq ($(CI),true)
	./node_modules/.bin/jest --ci
else
	node --inspect=9241 ./node_modules/.bin/jest --watch
endif

deploy:
ifeq ($(GITHUB_REF),refs/heads/main)
	npx standard-version
	git push origin --tags HEAD
	npm publish
endif