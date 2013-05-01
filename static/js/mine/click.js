Do.loadClick = function(me, uid, container, success, failed) {
  var API_CLICK = '/api/people/' + me + '/click/' + uid;

  var stopped = false;
  setTimeout(function() { stopped = true; }, 60000);

  success = success || function(r) {
    Do('lodash', function() {
      var lodash = require('lodash')._;
      var tmpl_click_index = lodash.template($('#tmpl-click-index').html());
      $(container).html(tmpl_click_index(r));
    });
  }

  function check() {
    $.getJSON(API_CLICK, function(res) {
      if (res.r) return failed();

      $(container).find('.progress-bar').width(res.p + '%');

      if (res.p === 100) return success(res.result);

      if (!stopped) setTimeout(check, 3000);
    }, failed);
  }

  failed = failed || function failed() {
    $(container).find('small').html('获取信息失败... 正在重试..');
    setTimeout(check, 7000);
  }

  Do(check);
};
