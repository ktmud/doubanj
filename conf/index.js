/**
* red configuration for different environment.
*/

/**
* export configurations.
*/
module.exports = readConfig();

/**
* read config from conf.js
* @return {object} express settings.
*/
function readConfig() {
  var NODE_ENV = global.process.env.NODE_ENV || 'development';
  var defaultConf = require('./default.conf.js');
  var conf = require('./' + NODE_ENV + '.conf.js');

  conf.__proto__ = defaultConf;

  // cryptokey for session
  conf.secret = createRandomString();

  return conf;
}

/**
* Random string for cryptoKey
* @return {string} randomString.
*/
function createRandomString() {
  var chars = '0123456789;[ABCDEFGHIJKLMfi]NOPQRSTUVWXTZ#&*abcdefghiklmnopqrstuvwxyz';
  var string_length = 10;
  var randomString = '';
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(rnum, rnum + 1);
  }
  return randomString;
}
