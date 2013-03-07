Do.ready(function() {

  var datetime = require('utils/datetime');

  var total = 0;
  function check(dur) {
    total += dur;

    // time out after two minutes.
    if (total > 120000) return;

    setTimeout(function() {
      $.getJSON('/api/people/' + window._uid_ + '/progress', function(d) {
        // failed, retry after 10 secs
        if (!d || d.r) return check(10000);

        updateProgress(d.percents);

        if (d.last_synced_status !== 'ing') {
          setTimeout(function() {
            window.location.reload();
          }, 700);
          return;
        }

        var remaining = d.remaining;
        updateRemains(remaining);

        if (remaining < 120000) {
          check(remaining < 5000 ? 400 : 3000);
        }
      });
    }, dur || 2000);
  }
  check();

  var prog = $('#progress');
  function updateProgress(d) {
    prog.find('.progress-bar').each(function(i, item) {
      $(item).css('width', (d[i] || 0) + '%');
    });
  }
  var remains = $('#remains');
  function updateRemains(t) {
    var text = '同步仍在进行，请耐心等待..';
    if (t > 300000) {
      text = '至少要五分钟以上，刷会儿广播再回来吧';
    } else if (t > 60000) {
      text = '预计还要' + datetime.mili2chinese(t, true) + '左右';
    } else if (t > 5000) {
      text = '只剩下大概' + datetime.mili2chinese(t);
    } else {
      text = '马上就好';
    }
    remains.html(text);
  }

  // refresh page after five minutes, no matter what
  setTimeout(function() {
    location.reload();
  }, 300000);
});
