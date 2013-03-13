var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest').Interest;

var utils = require('../utils');

function attach(context_name, fn) {
  return function(req, res, next) {
    fn(req, res, function(err, data) {
      res.data[context_name + '_err'] = err;
      res.data[context_name] = data;
      next();
    });
  }
}

module.exports = function(app, central) {
  var tasks = require(central.cwd + '/tasks');

  app.get(/^(\/api)?\/people\/[^\/]+$/, function(req, res, next) {
    return res.redirect(301, req._parsedUrl.pathname + '/');
  });
  app.get(/^(\/api)?\/people\/([^\/]+)\/?.*$/, utils.getUser({
    fn: function(req) { return req.params[1]; }
  }), function(req, res, next) {
    var uid = req.params[1]; 

    var people = res.data && res.data.people;

    var err = res.data && res.data.err;
    if (!people || people.invalid == 'NO_USER') {
      res.statusCode = err ? 500 : 404;
      res.data.err = res.data.err || res.statusCode;
      return res.render('people/failed', res.data);
    }
    if (uid === people.id && people.uid && people.uid !== people.id) {
      return res.redirect(301, '/people/' + people.uid + '/');
    }

    res.data.name = people.name || people.uid

    next();
  });

  var attach_latest = attach('latest_interests', function(req, res, cb) {
    var istatus = res.data.istatus;
    res.data.people[istatus.ns + '_latest'](istatus.status, 7, cb);
  });
  var attach_most_commented = attach('most_commented', function(req, res, cb) {
    var people = res.data.people;
    var istatus = res.data.istatus;
    res.data.people[istatus.ns + '_most_commented'](istatus.status, 30, cb);
  });
  var attach_highest_ratings = attach('highest_ratings', function(req, res, cb) {
    var people = res.data.people;
    var istatus = res.data.istatus;
    res.data.people[istatus.ns + '_highest_ratings'](istatus.status, 18, cb);
  });
  var do_render = function(tmpl) {
    return function(req, res, next) {
      res.render(tmpl, res.data);
    }
  };

  var availables = {
    'all': {
      'ns': 'book',
      'name': '全部',
      'status': 'all'
    },
    'read': {
      'ns': 'book',
      'name': '读过的书',
      'status': 'done'
    },
    'wish': {
      'ns': 'book',
      'name': '想读的书',
      'status': 'wish'
    }
  };

  app.get('/people/:uid/', function(req, res, next) {
    var people = res.data.people;
    var sleep = false;
    var recount = 'recount' in req.query;
    if ((!people.stats_p && people.last_synced_status === 'succeed') || recount) {
      process.nextTick(function() {
        //try compute the results
        tasks.compute.all({
          user: people,
          force: recount
        });
      });
      sleep = true;
    }
    setTimeout(function() {
      if (recount) {
        res.redirect(req._parsedUrl.pathname);
      } else {
        next();
      }
    }, sleep ? 100 : 0);
  }, function(req, res, next) {
    var people = res.data.people;

    res.data.istatus = availables.all;

    if (!people.stats) return res.render('people', res.data);

    next();
  }, attach_latest, attach_highest_ratings, do_render('people'));

  app.get('/people/:uid/:istatus', function(req, res, next) {
    var istatus = req.params.istatus;

    if (istatus == 'all') {
      return res.redirect('/people/' + req.params.uid + '/');
    } else if (istatus in availables) {
      istatus = res.data.istatus = availables[istatus];
    } else {
      return next(404);
    }

    var people = res.data.people;

    res.data.title = people.name + istatus.name;

    if (people.notReady() || people.isEmpty(istatus.ns)) {
      return res.redirect('/people/' + req.params.uid + '/');
    }
    next();
  }, attach_most_commented, do_render('people/sub'));

  app.get('/people/:uid/books', function(req, res, next) {
    var people = res.data.people;
    var start = req.query.start || 0;
    var count = 20;
    Interest.findByUser('book', people.uid, {
      start: start,
      count: count
    }, function(err, data) {
      var c = res.data;
      c.err = err;
      c.ns_name = '读书';
      c.interests = {
        book: data
      };
      res.render('people/interests', c);
    });
  });
};
