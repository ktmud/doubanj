
dev:
	forever -w -d app.js

watch:
	grunt watch

deploy:
	grunt deploy

init:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make
	grunt deps

.PHONY: dev watchh build deploy
