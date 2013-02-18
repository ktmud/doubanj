var util = require('util');
var fs = require('fs');

var cwd = process.cwd();

var log = fs.createWriteStream(cwd + '/var/stdout.log');
//var err = fs.createWriteStream(cwd + '/var/stderr.log');

util.log = console.log = console.info = function(t) {
  var out;
  if (t && ~t.indexOf('%')) {
    out = util.format.apply(util, arguments);
    process.stdout.write(out + '\n');
    return;
  } else {
    out = Array.prototype.join.call(arguments, ' ');
  }
  out && log.write(out + '\n');
};

//console.error = console.warn = function() {
  //var out = Array.prototype.join.call(arguments, ' ');
  //out && err.write(out + '\n');
//};

var dev = require('./development.conf');

module.exports = central.lib._.defaults({
  upyun: null,
  debug: false
}, dev);
