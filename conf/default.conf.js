var util = require('util');
var env = process.env;

var MONGO_HOST = env.MONGODB_HOST ? (env.MONGODB_HOST + ':' + (env.MONGODB_PORT || 27017)) : null;
var ARR_SPLITTER = /\s*,\s*/g;
var is_prod = env.NODE_ENV == 'production';

function getDoubanMore() {
  var ret = [];
  if (env.DOUBAN_APP_MORE) {
    ret = env.DOUBAN_APP_MORE.trim().split(ARR_SPLITTER).map(function(item, i) {
      var tmp = item.split(':');
      return {
        key: tmp[0],
        secret: tmp[1],
        limit: env.DOUBAN_APP_MORE_LIMIT || 10
      }
    });
  }
  return ret;
}

/**
 * some default settings
 */
module.exports = {
  debug: false,

  site_name: '豆瓣酱',

  // the port of the root server
  port: env.PORT || 3000,
  ssl_root: env.SSL_ROOT,
  site_root: env.SITE_ROOT || (is_prod ? 'http://www.doubanj.com' : 'http://localhost:3000'),
  assets_root: env.ASSETS_ROOT || (is_prod ? 'http://assets.doubanj.com' : 'http://localhost:3000'),

  salt: env.COOKIE_SALT || 'keyboardcatndog',

  // the Sentry client auth url
  // neccessray for tracking events in Sentry
  raven: null,

  mongo: {
    url: env.MONGO_URL,
    dbname: env.MONGODB_DATABASE || 'doubanj',
    username: env.MONGODB_USERNAME || null,
    password: env.MONGODB_PASSWORD || null,
    servers: [ MONGO_HOST || '127.0.0.1:27017']
  },

  redis: {
    url: env.REDIS_URL || 'redis://127.0.0.1:6379',
    port: env.REDIS_PORT || '6379',
    host: env.REDIS_IP || '127.0.0.1',
    prefix: 'doubanj_',
    // only set default ttl when there is a memory limit
    ttl: 7 * 24 * 60 * 60, // in seconds
  },

  // 管理员的豆瓣 uid
  admin_users: env.ADMIN_USERS ? env.ADMIN_USERS.split(ARR_SPLITTER) : ['yajc'],

  douban: {
    limit: env.DOUBAN_APP_LIMIT || 10, // request limit per minute
    key: env.DOUBAN_APP_KEY || 'my',
    secret: env.DOUBAN_APP_SECRET || 'god'
  },
  // more random api keys for public informations
  douban_more: getDoubanMore(),

  // google analytics id
  ga_id: ''
};
