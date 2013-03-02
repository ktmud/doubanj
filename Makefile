
dev:
	@$DEBUG="dbj:*" && forever -w -d app.js

watch:
	@$DEBUG="dbj:*" && grunt watch

init:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make
	cd ./static/ && component install -d
	grunt deps

deploy:
	grunt deploy

.PHONY: dev watch build deploy
