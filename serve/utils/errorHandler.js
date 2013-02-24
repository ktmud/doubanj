var debug = require('debug');
var error = debug('dbj:error');

module.exports = function(options) {
  options = options || {};

  // 500 / 403 page
  return function appError(err, req, res, next) {
    if (err == 403 || (String(err)).indexOf('Forbidden') != -1) {
      res.statusCode = 403;
      res.render('403', {
        statusCode: 403,
        data: { r: 1, err: err }
      });
      return;
    }

    if (err == 404 || err === 'not_found') {
      return notFound(req, res, next);
    }

    if (err.stack) {
      error(err.stack);
    } else {
      error(err);
    }

    if (typeof err === 'string') {
      res._exception = err;
    } else {
      res._exception = (err.name || err.reason);
    }

    req.session.onesalt = Date.now();
    
    if (res.headerSent) {
      res.end();
      return;
    }

    res.statusCode = 500;
    res.render('500', {
      onesalt: req.session.onesalt,
      statusCode: 500,
      data: { r: 1, err: err },
      err: err,
      stack: options.dump && err.stack
    });
  }
};

var notFound = module.exports.notFound = function(req, res, next) {
  if (req.method == 'HEAD') {
    return next();
  }
  res.statusCode = 404;
  res.render('404', {
    statusCode: 404,
    data: { r: 1, err: 404 }
  });
};
