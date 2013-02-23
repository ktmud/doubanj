
dev:
	forever -w -d app.js

watch:
	grunt watch

.PHONY: dev build deploy
