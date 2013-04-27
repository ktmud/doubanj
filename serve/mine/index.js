var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');

var auth_utils = require('../auth/utils');

module.exports = function(app, central) {

app.get('/mine', auth_utils.require_login, function(req, res, next) {
  res.render('mine', {
    people: req.user
  });
});

};
