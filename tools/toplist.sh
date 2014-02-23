#!/usr/bin/env bash

NODE_ENV='production'
DEBUG='dbj:*'

cd /srv/user/douban/doubanj/
node tools/toplist.js
