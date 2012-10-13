MOCHA_OPTS=--reporter nyan
UNIT_TEST_FILES=$(shell find test/unit/ -name '*.js')
ACCEPTANCE_TEST_FILES=$(shell find test/acceptance/ -name '*.js')
TIMEOUT=20000


install:
	@npm install

test: test-unit test-acceptance

test-unit:
	@NODE_ENV=test NODE_PATH=./lib ./node_modules/.bin/mocha \
		$(MOCHA_OPTS) --require test/unit/common $(UNIT_TEST_FILES)

test-acceptance:
	@NODE_ENV=test NODE_PATH=./lib ./node_modules/.bin/mocha \
		$(MOCHA_OPTS) --require test/acceptance/common --timeout $(TIMEOUT) \
		$(ACCEPTANCE_TEST_FILES)

run:
	node server.js

.PHONY: install test test-unit test-acceptance run
