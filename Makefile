
init:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make
	cd ./static/ && component install -d
	grunt deps

dev:
	forever -w -d app.js

watch:
	grunt watch

deploy:
	grunt deploy

.PHONY: dev watch build deploy
