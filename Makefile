start:
	@export DEBUG="dbj:*" && forever -w -d app.js

grunt:
	@export DEBUG="dbj:*" && grunt

build:
	@export DEBUG="dbj:*" && grunt build

watch:
	@export DEBUG="dbj:*" && grunt watch

init_bootstrap:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make

.PHONY: dev watch build deploy
