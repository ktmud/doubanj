function mili2united(timediff) {
  // strip the miliseconds
  timediff = Math.round(timediff / 1000);

  // get seconds
  var sec = timediff % 60;

  // remove seconds from the date
  timediff = Math.floor(timediff / 60);

  // get minutes
  var mi = timediff % 60;

  // remove minutes from the date
  timediff = Math.floor(timediff / 60);

  // get hours
  var h = timediff % 24;

  // remove hours from the date
  timediff = Math.floor(timediff / 24);

  // the rest of timediff is number of days
  var d = timediff;

  return [d,h,mi,sec];
}

function mili2chinese(timediff, no_sec) {
  var u = mili2united(timediff)
    , d = u[0], h = u[1]
    , mi = u[2], sec = u[3];

  if (no_sec) {
    mi = sec < 30 ? mi : mi + 1;
  }
  return (d ? d + '天' : '') +
    (h ? h + '小时' : '') +
    (mi ? mi + '分' + (no_sec ? '钟' : '') : '') +
    (no_sec ? '' : (u[3] || 0) + '秒');
}

module.exports = {
  mili2united: mili2united,
  mili2chinese: mili2chinese
};
