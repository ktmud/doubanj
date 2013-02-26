var central = {};
var istatic = require('express-istatic');

central.request = require('request');

var cwd = central.pwd = central.cwd = process.cwd();
var conf = central.conf = require(cwd + '/conf');

var consts = require(cwd + '/models/consts');
var utils = require('./utils');

var assets_root = central.assets_root = cwd + '/static/dist';

var reg_log = /_log\(.*?\);/g;
istatic.default({
  root: assets_root,
  debug: conf.debug,
  js: {
    filter: function(str) {
      return str.replace(reg_log, '');
    }
  }
});

// global consts
utils.extend(central, consts);

central.utils = utils;
central.task = require('./task');
central.mongo = require('./mongo');

central.staticPath = function(path) {
  if (conf.debug) return path;
  return conf.cdn_root + path;
};


central.template_helpers = {
  strftime: utils.strftime,
  conf: central.conf,
  static: central.staticPath,
  istatic: istatic.serve(),
};
utils.extend(central.template_helpers, utils.strftime.consts);

global.central = module.exports = central;
