var util = require('util');

/**
 * DEVELOPMENT Environment settings
 */
module.exports = {
  debug: true,
  sessionStore: {
    memcached: true,
    dbname: 'sessions',
    sync_time: 1 // minutes
  }
};
