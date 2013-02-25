var strftime = require('strftime');

var strftime_cn = strftime.localizedStrftime({
  days: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  shortDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  months: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  AM: '上午',
  PM: '下午',
  shortMonths: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
});

module.exports = strftime_cn;

strftime_cn.consts = {
  FULL_TIME: '%Y年%m月%d日 %H:%M:%S',
  FULL_TIME_1: '%Y年%m月%d日 %a %p%I点%M分%S秒',
  DIGIT_TIME: '%Y-%m-%d %H:%M:%S',
};
