//if (!module.parent) process.on('uncaughtException', function(err, next) {
  //var msg;
  //if (err instanceof Error) {
    //msg = '[err]: ' + err + '\n' + err.stack;
  //} else {
    //msg = (err.name || err.reason || err.message);
    //console.error(err);
  //}
  //console.error(msg);
  //next && next();
//});

var mo_url = require('url');
var express = require('express');
var central = require('./lib/central');
var serve = require('./serve');
var jade = require('jade');

var TWO_WEEKS = 60 * 60 * 24 * 14;

// initial bootstraping, only serve the API
module.exports.boot = function() {
  var app = express();
  app.enable('trust proxy')

  app.engine('jade', jade.renderFile);

  app.set('view engine', 'jade');
  app.set('view cache', !central.conf.debug);
  app.set('views', __dirname + '/templates');

  app.use(express.static(central.assets.root, { maxAge: TWO_WEEKS }));

  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.cookieSession({
    secret: central.conf.salt
  }));
  app.use(express.bodyParser());
  app.use(express.csrf());

  app.locals(central.template_helpers);

  app.use(function(req, res, next) {
    res.locals._csrf = req.session._csrf;
    req.is_ssl = req.headers['x-forwarded-proto'] === 'https';
    res.locals.static = function(url) {
      if (req.is_ssl) return mo_url.resolve(central.conf.https_root, url);
      return central.assets.fileUrl(url);
    },
    next();
  });

  serve(app, central);
  app.listen(central.conf.port);
  central.log('Now listening on ' + central.conf.port);
};

if (!module.parent) {
//setTimeout(function() {
  module.exports.boot();
//}, 20000);
}
