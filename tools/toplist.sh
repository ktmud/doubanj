#!/usr/bin/env bash

NODE_ENV='production'
DEBUG='dbj:*'

cd /srv/nodejs/doubanj/
node tools/toplist.js
