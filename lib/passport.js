var passport = require('passport');
var douban = require('passport-douban');
var local = passport.local = require('passport-local');

var conf = require('../conf/');
var User = require('../models/user');

var doubanStratege = new douban.Strategy({
  clientID: conf.douban.key,
  clientSecret: conf.douban.secret,
  callbackURL: conf.site_root + '/auth/douban/callback'
}, associate_douban);

function associate_douban(access_token, refresh_token, params, profile, done) {
  var data = profile._json;

  params.expire_date = new Date((+new Date() + (params.expires_in) - 30) * 1000),
  params.refresh_token = refresh_token;

  data.douban_token = params;

  var user = new User({ _id: profile.id });

  user.merge(data, done);
}

passport.use(new local.Strategy(User.getByPasswd));
passport.use(doubanStratege);

passport.serializeUser(function(user, done) {
  done(null, user.id || user._id);
});

passport.deserializeUser(User.getFromMongo);

module.exports = passport;
