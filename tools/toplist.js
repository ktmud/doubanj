#!/usr/bin/env node
var toplist = require('../tasks/toplist');
var async = require('async')

async.series([
  toplist.by_tag.users.bind(this, 'book', 'done'),
  toplist.by_tag.subjects.bind(this, 'book'),
  toplist.run.bind(toplist, 20000)
], process.exit)
