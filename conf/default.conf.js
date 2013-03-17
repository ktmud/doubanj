var util = require('util');

/**
 * some default settings
 */
module.exports = {
  debug: true,

  site_name: '豆瓣酱',

  // the port of the root server
  port: 3000,
  site_root: 'http://localhost:3000',
  ssl_root: 'https://localhost:3000',
  assets_root: 'http://localhost:3000',

  salt: 'keyboardcatndog',

  // the Sentry client auth url
  // neccessray for tracking events in Sentry
  raven: null,

  mongo: {
    dbname: 'doubanj',
    servers: ['127.0.0.1:27017']
  },

  redis: {
    port: '6379',
    host: '127.0.0.1',
    prefix: 'doubanj_',
    // only set default ttl when there is a memory limit 
    ttl: 7 * 24 * 60 * 60, // in seconds
  },

  douban: {
    limit: 20, // request limit per minute
    key: '',
    secret: ''
  },
  // more random api keys for public informations
  douban_more: [
    {
      limit: 20,
      key: '',
      secret: ''
    },
    {
      limit: 20,
      key: '',
      secret: ''
    },
    {
      limit: 20,
      key: '',
      secret: ''
    },
  ],

  // google analytics id
  ga_id: ''
};
