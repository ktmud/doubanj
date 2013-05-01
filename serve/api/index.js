var error = require('debug')('dbj:api');

module.exports = function(app, central) {
  var utils = central.utils;
  var cwd = central.cwd;
  var User = require(cwd + '/models/user').User;

  app.use('/api/', function(err, req, res, next) {
    if (err == 404) {
      res.statusCode = 404;
      return res.json({ r: 404 });
    }

    if (err) {
      error(err);
      if (err.stack) {
        console.error(err.stack);
      }

      central.raven.express(err, req, res);

      res.statusCode = err.statusCode || 500;
      return res.json({
        err: err.code || 500,
        msg: err.msg
      });
    }
    next();
  });
  app.get('/api/people/:uid/progress', function(req, res, next) {
    var people = res.data.people;
    if (people) {
      var remaining = people.remaining();
      var delay = central.task.API_REQ_DELAY;
      var ret = {
        r: 0,
        interval: people.progressInterval(remaining, delay),
        is_ing: people.isIng(),
        //last_synced: people.last_synced,
        //last_synced_status: people.last_synced_status,
        stats_status: people.stats_status,
        percents: people.progresses(),
        remaining: people.remaining()
      };
      //console.log(ret);
      res.json(ret);
    } else {
      res.statusCode = 404;
      res.json({
        r: 404
      });
    }
  });
  app.get('/api/people/:uid/', function(req, res, next) {
    var people = res.data.people;
    if (people) {
      res.json({
        id: people.id,
        created:  people.created,
        stats: people.stats,
        stats_p: people.stats_p,
        book_stats: people.book_stats,
      });
    } else {
      res.statusCode = 404;
      res.json({
        r: 404
      });
    }
  });
  app.get('/api/latest_synced', function(req, res, next) {
    User.latestSynced(function(err, users) {
      var people = users && users.map(function(item) {
        return {
          url: item.url(),
          name: item.name
        };
      }) || [];

      people = utils.shuffle(people).slice(0,12);

      res.json({
        r: err ? 500 : 0,
        people: people,
      });
    });
  });

};
