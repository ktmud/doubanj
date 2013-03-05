
dev:
	@$DEBUG="dbj:*" && forever -w -d app.js

watch:
	@$DEBUG="dbj:*" && grunt watch

init_bootstrap:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make

deploy:
	grunt deploy

.PHONY: dev watch build deploy
