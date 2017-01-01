// IP address to GeoInfo
var satelize = require('satelize');

exports.express = function() {
  return function(req, res, next) {
    // fallback to a Chinese IP address, just in case the client
    // didn't send an IP.
    var ip = req.headers['x-forwarded-for'] || '211.147.4.49';
    satelize.satelize({ ip: ip }, function(err, payload) {
      req.ipgeo = payload || { timezone: 'Asia/Shanghai' };
      next();
    })
  };
};
