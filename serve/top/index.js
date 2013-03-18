module.exports = function(app, central) {
  var toplist = require('../../models/toplist');

  function attach(method) {
    var tmp = method.split('.');
    var ns = tmp[0], fn = tmp[1];
    var args = [].slice.call(arguments, 1);

    return function(req, res, next) {
      var _args = args.slice();

      // add a callback
      _args.push(function(err, data) {
        if (err) {
          res.data.errors.push(err);
        }
        res.data[fn + '_' + _args[0]] = data;
        next();
      });

      toplist[ns][fn].apply(toplist[ns], _args);
    }
  }
  app.get('/top/', function(req, res, next) {
    res.data = res.data || {};
    res.data.errors = {};
    res.data.title = '排行榜';
    next();
  },
  attach('book.hardest_reader', 'all_time'),
  attach('book.hardest_reader', 'last_12_month'),
  attach('book.hardest_reader', 'last_year'),
  function(req, res, next) {
    res.render('toplist/index', res.data);
  });
};

