Do('lodash', function() {
  var tmpl = $.trim($('#tmpl-latest-synced').html());
  var lodash = require('lodash')._;

  $.getJSON('/api/latest_synced', function(res) {
    if (!res || res.r) return;
    $('.ticker-content', '#latest-synced').html(lodash.template(tmpl, res));
  });
});
