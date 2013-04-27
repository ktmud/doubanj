start:
	#@export DEBUG="dbj:*" && forever -w app.js
	@export DEBUG="dbj:*" && supervisor -w 'lib,serve,models,app.js,node_modules/passport-douban,conf,tasks,Gruntfile.js' -p 2000 app.js 

grunt:
	@export DEBUG="dbj:*" && grunt

build:
	@export DEBUG="dbj:*" && grunt build

watch:
	@export DEBUG="dbj:*" && grunt watch

cleanhash:
	@grunt clean:hash

init:
	@cp -iv ./conf/development.conf.tmpl.js ./conf/development.conf.js

update:
	@export DEBUG="dbj:* -*:verbose" && ./tools/update.js

init_bootstrap:
	git submodule init
	git submodule update
	cd ./static/components/bootstrap/ && npm install && make

.PHONY: dev watch build deploy
