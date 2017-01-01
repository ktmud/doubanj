/**
* To export a global variable `central`
*/
var central = {};

var debug = require('debug');
var log = central.log = debug('dbj:log');
var verbose = central.log.verbose = debug('dbj:verbose');
var error = central.log.error = debug('dbj:error');
var assets = require('./assets');
var consts = require('../models/consts');
var utils = require('./utils');
var conf = central.conf = require('../conf');
var raven = central.raven = require('./raven');
var redis = central.redis = require('./redis')(conf.redis);

central.pwd = central.cwd = process.cwd();
central.request = require('request');
central.boot_time = new Date();
central.DEBUG = central.conf.debug;

if (!('https_root' in conf)) {
  conf.https_root = conf.site_root.replace('http://', 'https://');
}

// global consts
utils.extend(central, consts);

central.utils = utils;
central.assets = assets;
central.task = require('./task');
central.mongo = require('./mongo');

redis.client.on('error', function(err) {
  raven.error(err, {
    tags: {
      cate: 'redis'
    },
  });
});

global.central = module.exports = central;

central.template_helpers = require('./template/helpers.js');
