var central = {};

var debug = require('debug');
var log = central.log = debug('dbj:log');
var verbose = central.log.verbose = debug('dbj:verbose');
var error = central.log.error = debug('dbj:error');

var assets = require('./assets');

central.request = require('request');

var cwd = central.pwd = central.cwd = process.cwd();
var conf = central.conf = require(cwd + '/conf');

var consts = require(cwd + '/models/consts');
var utils = require('./utils');

// global consts
utils.extend(central, consts);

central.utils = utils;
central.task = require('./task');
central.mongo = require('./mongo');
central.raven = require('./raven');

central.assets = assets;

central.template_helpers = {
  trunc: utils.trunc,
  strftime: utils.strftime,
  time_elapse: utils.time_elapse,
  conf: central.conf,
  static: assets.fileUrl,
  urlmap: function() {
    try {
      return JSON.stringify(assets.urlMap.apply(this, arguments));
    } catch (e) {}
    return '';
  },
  hashmap: function() {
    try {
      return JSON.stringify(assets.hashMap.apply(this, arguments));
    } catch (e) {}
    return '';
  },
  filehash: assets.getHash,
  istatic: assets.istatic.serve(),
};
utils.extend(central.template_helpers, utils.strftime.consts);

global.central = module.exports = central;
