var central = {};

central.request = require('request');

var cwd = central.pwd = central.cwd = process.cwd();
var conf = central.conf = require(cwd + '/conf');

var consts = require(cwd + '/models/consts');
var utils = require('./utils');

// global consts
utils.extend(central, consts);

central.task = require('./task');
central.mongo = require('./mongo');

central.staticPath = function(path) {
  if (conf.debug) return path;
  return conf.cdn_root + path;
};

global.central = module.exports = central;
