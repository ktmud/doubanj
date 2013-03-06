var passport = require('passport');

var mod_user = require('../models/user');

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getByPass(uid, password, function(err, user) {
    });
  }
));
