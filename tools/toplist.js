#!/usr/bin/env node

var toplist = require('../tasks/toplist');

function main() {
  toplist.by_tag.users('book', 'done', function() {
    toplist.by_tag.subjects('book', process.exit);
  });
}

main();
