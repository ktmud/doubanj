var conf = require('../conf');

var debug = require('debug');
var verbose = debug('dbj:verbose');
var message = debug('dbj:message');
var error = debug('dbj:error');

var client;

if (conf.raven) {
  var raven = require('raven');
  var client = new raven.Client(conf.raven, { logger: process.env.USER || 'general' });

  message = function(msg) {
    var params = [].slice.apply(arguments);

    process.nextTick(function() {
      params.shift();

      if (msg.indexOf('%s') !== -1) {
        msg = msg.replace(/\%s/g, function() {
          return params.shift();
        });
      }
      
      var extra = tags = null;
      if (params.length) {
        var extra = params[params.length - 1];
        params.pop();
      }
      if (extra && typeof extra !== 'object') {
        extra = { extra: extra };
      }
      if (extra) {
        tags = extra.tags;
        delete extra.tags;
      }
      var level = 'info';
      if ('level' in extra) {
        tags = tags || {};
        level = extra.level || level;
        tags.level = level;
        delete extra.level;
      }

      //console.log(level, tags, extra);
      client.captureMessage(msg, { 
        level: level,
        tags: tags,
        extra: extra,
      });
    });
  };
  error = function(err) {
    var args = [].slice.apply(arguments);

    if (typeof err === 'number') err = String(err);
    if (typeof err === 'string') {
      err = new Error(err);
    }
    args[0] = err;

    process.nextTick(function() {
      client.captureError.apply(client, args);
    });
  };

  client.on('logged', function(){
    verbose('Sent raven message.');
  });
  client.on('error', function(e){
    verbose(e.statusCode, 'sentry is broken.');
    verbose(e.responseBody);
  })

  if (!conf.debug) {
    client.patchGlobal(function(status, err) {
      console.error('wow~~ something is broken!');
      process.exit(1);
    });
  }
} else {
}

module.exports = {
  client: client,
  message: message, 
  error: error
};



