var tz = require('timezone/loaded');

function chinese_period(timediff, no_seconds) {
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
  return (d ? d + '天' : '') +
    (h ? h + '小时' : '') +
    (mi ? (no_seconds ? Math.round(mi) : mi) + '分' + (no_seconds ? '钟' : '') : '') +
    (!no_seconds ? sec + '秒' : '');
}

exports.timeformats = {
  FULL_TIME: '%Y年%m月%d日 %H:%M:%S',
  FULL_TIME_1: '%Y年%m月%d日%p%I点%M分%S秒',
  DIGIT_TIME: '%Y-%m-%d %H:%M:%S',
};

exports.strftime = function(format, time, timezone) {
  // language is always set to Chinese
  return tz(time, format, 'zh_CN', timezone);
};

exports.chinese_period = chinese_period;

exports.time_elapse = function time_elapse(date, now) {
  now = now || new Date();
  var y = now.getFullYear() - date.getFullYear();
  var m = now.getMonth() - date.getMonth();
  if (m < 0) {
    y--;
    m = m + 12;
  }

  date.setFullYear(date.getFullYear() + y);
  date.setMonth(date.getMonth() + m);

  var timediff = now - date;
  if (timediff < 0 ) {
    m--;
    var mo = date.getMonth();
    if (mo == 1) {
      date.setFullYear(date.getFullYear() - 1);
      date.setMonth(12);
    } else {
      date.setMonth(mo - 1);
    }
    timediff = now - date;
  }
  if (m < 0) m = 0;

  return (y ? y + '年' : '') +
    (m ? m  + '个月' : '') +
    chinese_period(timediff);
};
