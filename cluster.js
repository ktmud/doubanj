if (!module.parent) process.on('uncaughtException', function(err, next) {
  var msg;
  if (err instanceof Error) {
    msg = '[err]: ' + err + '\n' + err.stack;
  } else {
    msg = (err.name || err.reason || err.message);
    console.error(err);
  }
  console.error(msg);
  next();
});

var cluster = require('cluster');
var util = require('util');
var app = require(__dirname + '/app.js');
var central = require(__dirname + '/lib/central.js');

var numCPUs = Math.min(central.conf.worker, require('os').cpus().length);

function startWorker() {
  var worker = cluster.fork();
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    startWorker();
  }
  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died. restart...');
    startWorker();
  });
} else {
  app.boot();
}
