/**
* Task Queue Management.
*/
var util = require('util');

var central = require('../lib/central');
var extend = central.utils.extend;

function TaskQueue(key, mod, storage){
  this.store = storage;

  this.queue = [];

  this.mod = mod;
  this.key = key;

  // load exsiting queue
  this.load();
}
util.inherits(TaskQueue, require('events').EventEmitter);

TaskQueue.prototype.load = function() {
  var self = this;
  self.store.get(self.key, function(err, r) {
    if (err) {
      err = new Error(err);
      return self.emit('error', err);
    }
    self.queue = self.parse(r);
    self.emit('ready', self.queue);
  });
};

TaskQueue.prototype.parse = function(r) {
  if (!r) return this.queue;
  try {
    return JSON.parse(r);
  } catch (e) {
    //this.emit('error', e);
    return [];
  }
};
TaskQueue.prototype.stringify = function(r) {
  r = r || [];

  var mod = this.mod;
  r = r.filter(function(item) {
    // first argument is not a module method
    if (!(item[0] in mod)) return false;
    return true;
  });

  return JSON.stringify(r);
}

/**
* Reset or start a timer to dump
*/
TaskQueue.prototype._timer = function() {
  var self = this;
  if (self._t) {
    clearTimeout(self._t);
  }
  self._t = setTimeout(function() {
    self.dump();
  }, 500);
};

TaskQueue.prototype.push = function() {
  this._changed = true;
  this.queue.push([].slice.apply(arguments));

  this._timer();
};

TaskQueue.prototype.shift = function() {
  this._changed = true;
  var args = [].slice.apply(arguments);
  this.queue = this.queue.filter(function(item) {
    while (item[0]) {
      if (item.shift() != args.shift()) {
        return true;
      }
    }
    return false;
  });

  this._timer();
};

TaskQueue.prototype.resume = function() {
  var queue = this.queue.slice();
  var mod = this.mod;
  var arg, fn;
  while(queue.length) {
    arg = queue.shift();
    fn = mod[arg.shift()];
    fn && fn.apply(mod, arg);
  }
};

/**
* To make arguments safe for resume task
*/
TaskQueue.prototype.safely = function(fn_name, arg) {
  if (!this.mod[fn_name]) throw new Error('invalid function name');

  var self = this;
  var queue_arg = extend({}, arg);

  // clean vars
  queue_arg.user = queue_arg.user.uid || queue_arg.user.id || queue_arg.user;
  queue_arg.error = queue_arg.success = null;

  var cb1 = arg.success;
  var cb2 = arg.error;
  // decorate callbacks
  arg.success = function() {
    self.shift(fn_name, queue_arg);
    cb1 && cb1.apply(this, arguments);
  };
  arg.error = function() {
    self.shift(fn_name, queue_arg);
    cb2 && cb2.apply(this, arguments);
  };

  // special identifier for recovery
  queue_arg._from_halt = true;

  self.push(fn_name, queue_arg);

  return arg;
};

/**
* Dump the whole queue to storage
*/
TaskQueue.prototype.dump = function() {
  var self = this;
  if (!this._changed) return;
  self.store.set(self.key, self.stringify(self.queue), function(err, r) {
    if (err) return self.emit('error', err);
    self._changed = false;
    self.emit('dumped');
  });
};

module.exports = TaskQueue;
