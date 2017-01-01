// IP address to GeoInfo
var satelize = require('satelize');

exports.express = function() {
  return function(req, res, next) {
    var ip = req.headers['x-forwarded-for'];
    //var ip = '212.58.244.23';
    satelize.satelize({ ip: ip }, function(err, payload) {
      req.ipgeo = payload || { timezone: 'Asia/Shanghai' };
      next();
    })
  };
};
