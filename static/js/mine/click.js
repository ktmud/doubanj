Do.loadClick = function(uid, container) {
  var API_CLICK = '/api/mine/click/' + uid;

  var stopped = false;

  setTimeout(function() { stopped = true; }, 60000);

  function check() {
    $.getJSON(API_CLICK, function(res) {
      if (res.r) return failed();
      if (res.p === 100) return success(res.result);
      $(container).find('.progress-bar').width(res.p + '%');
      if (!stopped) setTimeout(check, 3000);
    });
  }

  function success(r) {
    Do('lodash', function() {
      var lodash = require('lodash')._;
      var tmpl_click_index = lodash.template($('#tmpl-click-index').html());
      $(container).html(tmpl_click_index(r));
    });
  }

  function failed() {
    $(container).find('small').html('获取信息失败... 正在重试..');
    setTimeout(check, 7000);
  }

  Do(check);
};
