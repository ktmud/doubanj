var strftime = require('strftime');

var strftime_cn = strftime.localizedStrftime({
  days: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  shortDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  months: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  shortMonths: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
});
module.exports = {
  strftime: strftime_cn,
  extend: function extend(target) {
      // Using `extend` from https://github.com/Raynos/xtend 
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]
          , keys   = Object.keys(source);

        for (var j = 0; j < keys.length; j++) {
          var name = keys[j];
          target[name] = source[name];
        }
      }

      return target
  }
}
