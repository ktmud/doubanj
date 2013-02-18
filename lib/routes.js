var fs = require('fs');

var verbs = ['get', 'post', 'head', 'put', 'del'];

function handle(app, dir) {
  var mod = require(dir);
  for (var c in mod) {
    var verb = 'get';
    var tmp = c.split(/\s+/);
    if (tmp.length == 2) {
      verb = tmp[0];
      c = tmp[1];
    }
    app[verb](c, mod[fn]);
  }
}

// load router modules
module.exports = function(app, dir) {
};
