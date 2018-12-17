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

var central = require('./lib/central');
var passport = require('./lib/passport');
var ip2geo = require('./lib/ip2geo');
var serve = require('./serve');
var jade = require('jade');
var Redis = require('redis');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var methodOverride = require('method-override');
var serveStatic = require('serve-static');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var csrf = require('csurf');

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

  app.use(serveStatic(central.assets.root, { maxAge: TWO_WEEKS }));

  app.use(methodOverride());
  app.use(cookieParser());

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  app.use(bodyParser.json())

  app.use(session({
    secret: conf.salt,
    store: new RedisStore({
      client: Redis.createClient(conf.redis)
    })
  }));
  app.use(ip2geo.express());
  app.use(passport.initialize());
  app.use(passport.session());

  app.locals = {
    ...app.locals,
    ...central.template_helpers
  }

  app.use(csrf());

  app.use(function(req, res, next) {
    req.is_ssl = req.headers['x-forwarded-proto'] === 'https';
    res.locals.req = req;
    res.locals._csrf = req.csrfToken();
    res.locals.static = function(url) {
      if (req.is_ssl) return URL.resolve(central.conf.https_root, url);
      return central.assets.fileUrl(url);
    };
    res.locals.strftime = central.template_helpers.strftime.bind(res.locals);
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
