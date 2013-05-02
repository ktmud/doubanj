module.exports = function(app, central) {

var lodash = require('lodash');
var async = require('async');

var utils = require('../utils');

var cwd = central.cwd;
var tasks = require(cwd + '/tasks');
var User = require(cwd + '/models/user').User;
var Interest = require(cwd + '/models/interest');
var Subject = require(cwd + '/models/subject');

function getInterest(user, subject_ids, callback) {
  Interest.book.findByUser(user.id, {
    query: {
      subject_id: {
        $in: subject_ids
      },
    },
    limit: null
  }, callback);
}

function makeDict(interests, prop) {
  var ret = {};
  interests.forEach(function(item, i) {
    if (item) {
      ret[item[prop]] = item;
    }
  });
  return ret;
}

app.param('other', function(req, res, next, other_uid) {
  var people = res.data.people;

  if (other_uid === people.uid) return res.redirect(people.url());

  function defineName(user) {
    return user._name = (user === req.user ? '你' : user.name);
  }

  function done(err, other) {
    if (err || !other) return next(err || 404);

    if (people.id === other.id) {
      return res.redirect(people.url());
    }

    [people, other].forEach(defineName);

    res.data.other = other;


    next();
  }

  if (req.user && req.user.uid === other_uid) {
    return done(null, req.user);
  }

  User.get(other_uid, done);
}, function getClicks(req, res, next) {
  var people = res.data.people;
  var other = res.data.other;

  if (!people.book_stats || !other.book_stats) {
    res.render('people/click/not_ready', res.data);
    return;
  }
  people.getClick(other, function(err, clicks) {
    if (err) return next(err);
    res.data.clicks = clicks;
    next();
  });
});

function getAllInterests(req, res, next) {
  var c = res.data;
  var book_ids = c.all_book_ids;

  c.mutual_keywords = c.clicks.mutual_tags;

  async.map([c.people, c.other],
    function(user, callback) {
      getInterest(user, book_ids, callback);
    },
    function(err, ret) {
      c.people._interest_by_subject_id = makeDict(ret[0], 'subject_id');
      c.other._interest_by_subject_id = makeDict(ret[1], 'subject_id');
      next();
    });
}

function getAllBooks(req, res, next) {
  Subject.book.gets(res.data.all_book_ids, {
    fields: 'simple'
  }, function(err, items) {
    //console.log(items[0]);
    if (err) return next(err);
    res.data.all_books = makeDict(items, 'id');
    next();
  });
} 

app.get('/people/:uid/click/:other', function(req, res, next) {
  var clicks = res.data.clicks;

  if (!clicks || !clicks.ratios) {
    res.render('people/click/loading', res.data);
    return;
  }

  var all_book_ids = [];
  for (var k in clicks) {
    if (Array.isArray(clicks[k]) && parseInt(clicks[k][0])) {
      var n = k === 'commented' ? 10 : 6;
      all_book_ids = lodash.union(all_book_ids, clicks[k].slice(0, n));
    }
  }
  res.data.click_grade = res.data.people.clickGrade(clicks.score);
  res.data.all_book_ids = all_book_ids;

  next();
}, getAllInterests, getAllBooks, function(req, res, next) {
   res.render('people/click', res.data);
});

app.get('/api/people/:uid/click/:other', function(req, res, next) {
  var a = res.data.people, b = res.data.other;

  if (!a || !b) {
    return next(404);
  }
  
  if (!a.book_stats || !b.book_stats) {
    res.json({
      r: 400,
      msg: '必要数据还没准备好呢'
    });
    return;
  }

  var r = res.data.clicks;
  if (r === null || typeof r !== 'object' || r.retry_count > 15) {
    r = { p: r && r.p || 10 };
    a.setClick(b, r, function() {
      tasks.click.book({ users: [a, b] });
    });
  }
  if (r.p !== 100 || !r.ratios) {
    r.retry_count = r.retry_count || 0; 
    r.retry_count += 1;
    r.p = Math.min(r.p + 7, 70) || 10;
    a.setClick(b, r);
  }

  var result;
  if (r.ratios) {
    result = {
      b_name: b.name,
      a: a.uid,
      b: b.uid,
      score: r.score,
      reliability: r.reliability
    };
  } else {
    result = {
      retry_count: r.retry_count,
      error: r.error
    };
  }

  res.json({ r: 0, p: r.p, result: result });
});

app.get('/people/:uid/click/:other/quote', function(req, res, next) {
  var clicks = res.data.clicks;

  if (!clicks || !clicks.ratios) {
    return res.redirect(res.data.people.click_url(res.data.other));
  }
  res.data.all_book_ids = res.data.clicks.commented;
  res.data.click_grade = res.data.people.clickGrade(clicks.score);

  next();
}, getAllInterests, getAllBooks, function(req, res, next) {
  res.data.commented = res.data.all_book_ids;
  res.render('people/click/quote', res.data);
});

};
