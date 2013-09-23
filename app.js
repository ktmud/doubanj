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

var URL = require('url');
var express = require('express');

var connect_domain = require('./lib/connect_domain');
var central = require('./lib/central');
var passport = require('./lib/passport');
var serve = require('./serve');
var jade = require('jade');
var Redis = require('redis');
var RedisStore = require('connect-redis')(express);

var TWO_WEEKS = 60 * 60 * 24 * 14;

// initial bootstraping, only serve the API
module.exports.boot = function() {
  var app = express();
  var conf = central.conf;
  app.enable('trust proxy')

  app.engine('jade', jade.renderFile);

  app.set('view engine', 'jade');
  app.set('view cache', !central.conf.debug);
  app.set('views', __dirname + '/templates');

  app.use(connect_domain());

  app.use(express.static(central.assets.root, { maxAge: TWO_WEEKS }));

  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({
    secret: conf.salt,
    store: new RedisStore({
      client: Redis.createClient(conf.redis)
    })
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.locals(central.template_helpers);

  app.use(express.csrf());

  app.use(function(req, res, next) {
    res.locals._csrf = req.csrfToken();
    req.is_ssl = req.headers['x-forwarded-proto'] === 'https';
    res.locals.static = function(url) {
      if (req.is_ssl) return URL.resolve(central.conf.https_root, url);
      return central.assets.fileUrl(url);
    };
    res.locals.req = req;
    next();
  });

  serve(app, central);

  app.listen(central.conf.port);
  central.log('Now listening on ' + central.conf.port);
  central.log('Site root: ' + central.conf.site_root);
};

if (!module.parent) {
//setTimeout(function() {
  module.exports.boot();
//}, 20000);
}
