var Redis = require('redis')
var conf = require('../conf')
var Cacheable = require('cacheable')

var client = Redis.createClient(conf.redis)

module.exports = new Cacheable({
  prefix: 'doubanj:',
  client: client
})
