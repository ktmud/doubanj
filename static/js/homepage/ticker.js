Do('lodash', function() {
  var tmpl = $('#tmpl-latest-synced').html().trim();
  var lodash = require('lodash')._;

  $.getJSON('/api/latest_synced', function(res) {
    if (!res || res.r) return;
    $('.ticker-content', '#latest-synced').html(lodash.template(tmpl, res));
  });
});
