var util = require('util');

/**
 * DEVELOPMENT Environment settings
 */
module.exports = {
  debug: true,
  assets_root: 'http://127.0.0.1:3000/',
  sessionStore: {
    memcached: true,
    dbname: 'sessions',
    sync_time: 1 // minutes
  }
};
