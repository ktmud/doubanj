var pool = require('./pool');
var mongo = pool.instant;

mongo.pool = pool;
mongo.Model = require('./model');

mongo.queue = require('../task').queue(pool, 2);

module.exports = mongo;
