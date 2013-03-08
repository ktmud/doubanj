var cwd = central.cwd;
var User = require(cwd + '/models/user').User;

module.exports = function(app, central) {
  app.get('/api/people/:uid/progress', function(req, res, next) {
    var people = res.data.people;
    if (people) {
      var remaining = people.remaining();
      var delay = central.task.API_REQ_DELAY;
      var ret = {
        r: 0,
        interval: people.progressInterval(remaining, delay),
        last_synced: people.last_synced,
        last_synced_status: people.last_synced_status,
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
};
