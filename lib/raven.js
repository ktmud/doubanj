/**
* To send messages to Sentry.
*/
var conf = require('../conf');

var debug = require('debug');
var verbose = debug('dbj:raven:verbose');
var message = _message = debug('dbj:raven:message');
var error = _error = debug('dbj:raven:error');

var client;

if (conf.raven) {
  var raven = require('raven');
  client = new raven.Client(conf.raven, {
    logger: process.env.USER || 'general',
    site: conf.site_name,
  });

  message = function(msg) {
    var args = [].slice.apply(arguments);

    _message.apply(debug, args);

    if (!client._enabled) return;

    setImmediate(function() {
      args.shift();

      if (msg.indexOf('%s') !== -1) {
        msg = msg.replace(/\%s/g, function() {
          return args.shift();
        });
      }
      
      var extra = tags = null;
      if (args.length) {
        extra = args[args.length - 1];
        args.pop();
      }
      if (extra && typeof extra !== 'object') {
        extra = { extra: extra };
      }
      if (extra) {
        tags = extra.tags;
        delete extra.tags;
      }
      var level = 'info';
      if (extra && 'level' in extra) {
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

    if (!client._enabled) return;

    if (typeof err === 'number') err = String(err);
    if (typeof err === 'string') {
      if (err.indexOf('%s') !== -1) {
        err = err.replace(/\%s/g, function() {
          return args.shift();
        });
      }
      err = new Error(err);
    }
    args[0] = err;

    setImmediate(function() {
      client.captureError.apply(client, args);
    });
  };

  client.on('logged', function(){
    _message('Sent raven message.');
  });
  client.on('error', function(e){
    _error('sentry is broken: %s', e);
  })

  if (!conf.debug) {
    process.on('uncaughtException', function(e, next) {
      console.error(e);
      if (e.stack) {
        console.error(e.stack);
      }
      next && next();
    });
    client.patchGlobal(function(status, err) {
      console.error('wow~~ something is broken!');
      process.exit(1);
    });
  }
}

var URL = require('url');

function express(err, req, res) {
  error(err, {
    'sentry.interfaces.Http': { 
      method: req.method,
      query_string: URL.parse(req.url).query,
      headers: req.headers,
      cookies: req.cookies || '<unavailable: use cookieParser middleware>',
      data: req.body || '<unavailable: use bodyParser middleware>',
      url: (function build_absolute_url() {
          var protocol = req.is_ssl ? 'https' : 'http',
              host = req.headers.host || '<no host>';
          return protocol+'://'+host+req.url;
      }()),
      env: process.env
    }
  });
}
module.exports = {
  client: client,
  message: message, 
  error: error,
  express: express,
};
