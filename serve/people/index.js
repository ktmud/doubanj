var lodash = require('lodash');
var async = require('async');

var cwd = central.cwd;
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');
var Subject = require(cwd + '/models/subject');

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

  app.get(/^\/people\/[^\/]+$/, function(req, res, next) {
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
      return res.redirect(301, req._parsedUrl.pathname.replace(uid, people.uid));
    }

    res.data.name = people.name || people.uid

    if (people.book_stats) return next();
    people.data('book_stats', function(err, ret) {
      if (err) return next(err);
      people.book_stats = ret;
      next();
    });
  });

  var attach_latest = attach('latest_interests', function(req, res, cb) {
    var istatus = res.data.istatus;
    res.data.people[istatus.ns + '_latest']({
      status: istatus.status,
      limit: 7,
    }, cb);
  });
  var attach_most_commented = attach('most_commented', function(req, res, cb) {
    var people = res.data.people;
    var istatus = res.data.istatus;

    res.data.people[istatus.ns + '_most_commented']({
      //status: istatus.status,
      limit: res.data.perpage || 20,
      start: req.query.start
    }, function(err, ret) {
      ret = ret && ret.filter(function(item) {
        return item.comment;
      });
      cb(err, ret);
    });
  });
  var attach_highest_ratings = attach('highest_ratings', function(req, res, cb) {
    var people = res.data.people;
    var istatus = res.data.istatus;
    res.data.people[istatus.ns + '_highest_ratings']({
      status: istatus.status, limit: 18
    }, cb);
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
  }, attach_latest, attach_highest_ratings, function(req, res, next) {
    var people = res.data.people;
    var user = req.user;
    if (user && user !== people) {
      res.data.user = user;
      user.getClick(people, function(err, ret) {
        if (ret && ret.ratios) {
          user._click = ret;
        }
        next();
      });
      return;
    }
    next();
  }, do_render('people'));

  app.get('/people/:uid/quote', function(req, res, next) {
    var people = res.data.people;

    var istatus = res.data.istatus = availables['read'];

    if (people.notReady() || people.isEmpty(istatus.ns)) {
      return res.redirect('/people/' + req.params.uid + '/');
    }

    var perpage = res.data.perpage = Math.max(20, parseInt(req.query.perpage, 10)) || 20;
    var start = req.query.start = Math.max(0, parseInt(req.query.start, 10)) || 0;

    res.data.title = people.name + '的阅读体悟';

    Interest.book.count({
      user_id: people._id,
      commented: {
        $gt: 0
      },
    }, function(err, r) {
      var total = res.data.commented_total = r;
      var n = 1;
      if (start > 0) {
        n = res.data.page_now = Math.floor(start / perpage + 1);
        res.data.title += ' - 第' + n + '页';
      }
      if (start > total) {
        res.redirect('/people/' + req.params.uid + '/quote?start=' + (Math.ceil(total / perpage) - 1) * perpage);
      }

      next();
    });
  }, attach_most_commented, do_render('people/quote'));

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

  function getInterest(user, book_ids, callback) {
    Interest.book.findByUser(user.id, {
      book_id: {
        $in: book_ids
      },
      limit: 0
    }, callback);
  }

  function makeDict(interests, prop) {
    var ret = {};
    interests.forEach(function(item, i) {
      ret[item[prop]] = item;
    });
    return ret;
  }

  app.get('/people/:uid/click/:other', function(req, res, next) {
    var people = res.data.people;
    var other_uid = req.param('other');

    if (other_uid === people.uid) return res.redirect(people.url());

    function defineName(user) {
      return user._name = (user === req.user ? '你' : user.name);
    }

    function done(err, other) {
      if (err || !other) return next(err || 404);

      if (people.id === other.id) {
        return res.redirect(people.url());
      }
      if (req.user) {
        [people, other].forEach(defineName);
      }

      res.data.other = other;
      next();
    }

    if (req.user && req.user.uid === other_uid) {
      return done(null, req.user);
    }

    User.get(other_uid, done);
  }, function(req, res, next) {
    var people = res.data.people;
    var other = res.data.other;

    people.getClick(other, function(err, clicks) {
      if (err) return next(err);

      if (!clicks) {
        res.render('people/click/not_ready', res.data);
        return;
      }

      res.data.clicks = clicks;

      var all_book_ids = [];
      for (var k in clicks) {
        if (Array.isArray(clicks[k])) {
          all_book_ids = lodash.union(all_book_ids, clicks[k].slice(0,8));
        }
      }
      res.data.click_grade = people.clickGrade(clicks.index);
      res.data.all_book_ids = all_book_ids;
      next();
    });
  }, function(req, res, next) {
    var c = res.data;
    var book_ids = c.all_book_ids;

    c.mutual_keywords = getMutualKeywords(c.people.book_stats, c.other.book_stats);

    async.map([c.people, c.other],
      function(user, callback) {
        getInterest(user, book_ids, callback);
      },
      function(err, ret) {
        c.people._interest_by_subject_id = makeDict(ret[0], 'subject_id');
        c.other._interest_by_subject_id = makeDict(ret[1], 'subject_id');
        next();
      });
  }, function(req, res, next) {

    Subject.book.gets(res.data.all_book_ids, function(err, items) {
      if (err) return next(err);
      res.data.all_books = makeDict(items, 'id');
      res.render('people/click', res.data);
    });
  });

  function getMutualKeywords(a, b) {
    b = lodash(b.interest.top_tags).pluck('_id')
        .object(lodash.pluck(b.interest.top_tags, 'count'))
        .value();
    return a.interest.top_tags.filter(function(item) {
      if (item._id in b) {
        item.count_b = b[item._id];
        return true;
      }
    });
  }
};
