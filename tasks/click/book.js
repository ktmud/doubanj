var central = require('../..//lib/central');

var Interest = require('../../models/interest');
var async = require('async');
var lodash = require('lodash');

function getIds(query) {
  return function getDoneIds(u, cb) {
    var opts = {
      // only get subject_ids
      fields: { subject_id: 1, _id: -1 },
      limit: null,
    };

    if (query) {
      opts.query = query;
    }

    Interest.book.findByUser(u.id, opts, function(err, docs) {
      if (err) return cb(err);

      return cb(null, lodash.pluck(docs, 'subject_id'));
    });
  }
}

function intersects(query) {
  return function(users, next) {
    async.map(
      users,
      getIds(query),
      function(err, results) {
        if (err) return next(err);

        try {
          var intersec = lodash.intersection.apply(lodash, results);
          results.push(intersec);
        } catch (e) {
          return next(e);
        }
        next(null, results);
      });
  }
}

function getErrorCode(err) {
  return String(err);
}

function main(users, callback) {

  function asyncTask(query) {
    return function(next) {
      async.waterfall([async.apply(intersects(query), users), updateProgress], next);
    };
  }

  var tasks = [
    asyncTask({ status: 'done' }),
    asyncTask({ status: 'wish' }),
    asyncTask({ 'rating.value': { '$gt': '3' } }),
    asyncTask({ 'rating.value': { '$lt': '3' } }),
    asyncTask({ commented: { $ne: null } }),
  ];

  var progress = 10, finalResult;
  var p_perstep = 90 / tasks.length;
  var _t_save_progress = setTimeout(function(){}, 0);

  function do_updateProgress() {
    users[0].setClick(users[1], { p: progress }, function() {
      // 如果还有最终结果，得再存一次
      if (finalResult) users[0].setClick(users[1], finalResult);
    });
  }

  function updateProgress(result, next) {

    progress += p_perstep;

    clearTimeout(_t_save_progress);
    _t_save_progress = setTimeout(do_updateProgress, 2000);

    next(null, result);
  }

  async.parallel(tasks, function(err, res) {
    clearTimeout(_t_save_progress);

    var ret;

    if (err) {
      ret = {
        p: progress,
        error: getErrorCode(err)
      };
    } else {
      var results = [];
      // the last is the intersection
      res.forEach(function(item) {
        results.push(item.pop());
      });

      ret = {
        done: results[0],
        wish: results[1],
        love: results[2],
        hate: results[3],
        commented: results[4],
      }

      if (users.length === 2) {
        // 想读的你读过的书
        ret.wish_done = lodash.intersection(res[0][1], res[1][0]);
        // 读过的你想读的书（users[1] 代表对方，users[0] 代表自己）
        ret.done_wish = lodash.intersection(res[0][0], res[1][1]);
        // 你给高分，他却不喜欢的
        ret.hate_love = lodash.intersection(res[2][0], res[3][1]);
        // 你不喜欢，他却给高分的
        ret.love_hate = lodash.intersection(res[2][1], res[3][0]);
      }

      // 占比
      ret.ratios = getRatios(ret, res);
      // 契合指数
      ret.index = calcIndex(ret.ratios, res);

      ret.reliability = reliability(res);

      var top_tags = [];
      users.forEach(function(u) {
        top_tags.push(u.book_stats.interest.top_tags);
      });
      ret.mutual_tags = getMutual(top_tags);

      console.log(ret.mutual_tags);

      ret.p = 100;
    }

    finalResult = ret;

    users[0].setClick(users[1], ret, function(e) {
      callback(e || err, ret);
    });
  });

  function getRatios(ret, ids_list) {
    var ratios = {};
    var all_ids = {
      done: ids_list[0],
      wish: ids_list[1],
      love: ids_list[2],
      hate: ids_list[3],
      commented: ids_list[4],

      wish_done: ids_list[0],
      done_wish: ids_list[1],
      hate_love: ids_list[2],
      love_hate: ids_list[3],
    };
    for (var k in ret) {
      var ids = ret[k];
      ratios[k] = all_ids[k].map(function(item, i) {
        return ids.length / item.length;
      });
    }
    return ratios;
  }

  function sum(a, b) { 
    return (a || 0) + (b || 0);
  }

  function min(a, b) {
    return Math.min(a || 0, b || 0);
  }

  function calcIndex(r, all_ids) {
    var i = 0;
    var factors = {
      done: 2.5,
      wish: 1,
      love: 3,
      hate: 1.5,
      commented: 2,

      done_wish: 1,
      wish_done: 1,
      hate_love: -1,
      love_hate: -1
    };

    for (var k in r) {
      if (r[k]) {
        i += r[k].reduce(min) * factors[k];
      }
    }

    return Math.round(i * 1000);
  }

  // 可信度，收藏数量越接近，越为可信
  function reliability(all_ids) {
    var lens = all_ids[0].map(function(item) { return item.length; });
    var max = Math.max.apply(Math, lens);
    var min = Math.min.apply(Math, lens);
    return Number((100 - (max - min) / max * 100).toFixed(2));
  }

  function getMutual(list) {
    return lodash.reduce(list, function(a, b) {
      b = lodash(b).pluck('_id')
          .object(lodash.pluck(b, 'count'))
          .value();
      return a.filter(function(item) {
          if (item._id in b) {
            item.count_b = b[item._id];
            return true;
          }
        });
    });
  }
}

module.exports = main;
