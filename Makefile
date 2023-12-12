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
	rm -rf lib/esm/test/ lib/cjs/test/
	find ./lib -type f -name '*.test.*' -delete

test: prepare-when-local
	./node_modules/.bin/vitest

deploy:
ifeq ($(GITHUB_REF),refs/heads/main)
	npx standard-version
	git push origin --tags HEAD
	npm publish
endif