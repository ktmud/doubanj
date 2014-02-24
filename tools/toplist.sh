#!/usr/bin/env bash

export NODE_ENV='production'
export DEBUG='dbj:*'

cd /srv/user/douban/doubanj/
node tools/toplist.js
