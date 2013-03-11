var strftime = require('strftime');

var strftime_cn = strftime.localizedStrftime({
  days: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  shortDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  months: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  AM: '上午',
  PM: '下午',
  shortMonths: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
});
strftime_cn.consts = {
  FULL_TIME: '%Y年%m月%d日 %H:%M:%S',
  FULL_TIME_1: '%Y年%m月%d日 %a %p%I点%M分%S秒',
  DIGIT_TIME: '%Y-%m-%d %H:%M:%S',
};

exports.strftime = strftime_cn;

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

  return (y ? y + '年' : '') +
    (m ? m  + '个月' : '') +
    (d ? d + '天' : '') +
    (h ? h + '小时' : '') +
    (mi ? mi + '分' : '') + sec + '秒';
};
