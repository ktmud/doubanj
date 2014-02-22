start:
	#@export DEBUG="dbj:*" && forever -w app.js
	@export DEBUG="dbj:*" && supervisor -w 'lib,serve,models,app.js,conf,tasks,Gruntfile.js' -p 1000 app.js 

grunt:
	@export DEBUG="dbj:*" && grunt

build:
	@export NODE_ENV="production" && export DEBUG="dbj:*" && \
	npm install --production && \
	bower install && \
	grunt build --force

watch:
	@export DEBUG="dbj:*" && grunt watch

cleanhash:
	@grunt clean:hash

init:
	@cp -iv ./conf/development.conf.tmpl.js ./conf/development.conf.js

update:
	@export NODE_ENV=production && export DEBUG="dbj:* -*:verbose" && ./tools/update.js

toplist:
	@export DEBUG="dbj:*" && ./tools/toplist.js

init_bootstrap:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make

tail:
	@tail -f -n 60 /srv/log/nodejs/doubanj.log

.PHONY: dev watch build deploy
