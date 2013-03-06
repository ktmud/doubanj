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
    client.captureMessage(msg, { 
      level: 'info',
      params: params,
      tags: tags,
      extra: extra,
    });
  };
  error = function(err) {
    if (typeof err === 'number') err = String(err);
    if (typeof err === 'string') {
      err = new Error(err);
    }
    var args = [].slice.apply(arguments);
    args[0] = err;
    client.captureError.apply(client, args);
  };

  client.on('logged', function(){
    verbose('Sent raven message.');
  });
  client.on('error', function(e){
    verbose(e.statusCode, 'sentry is broken.');
    verbose(e.responseBody);
  })

  client.patchGlobal(function(err) {
    console.log(err);
    console.error('WOW, something is broken!');
    process.exit(1);
  });
} else {
}

module.exports = {
  client: client,
  message: message, 
  error: error
};



