Do.ready(function() {

  var datetime = require('utils/datetime');

  var total = 0;
  function check(dur) {
    total++;

    // stop after 100 request
    if (total > 100) return;

    if (dur < 500) dur = 500;

    setTimeout(function() {
      $.getJSON('/api/people/' + window._uid_ + '/progress', function(d) {
        // failed, retry after 10 secs
        if (!d || d.r) return check(10000);

        updateProgress(d.percents);

        var remaining = d.remaining;
        updateRemains(remaining);

        if (!d.is_ing) {
          setTimeout(function() {
            window.location.reload();
          }, 800);
          return;
        }

        if (remaining < 180000) {
          check(d.interval);
        }
      });
    }, dur || 3000);
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
    } else if (t) {
      text = '马上就好';
    }
    remains.html(text);
  }

  // refresh page after five minutes, no matter what
  setTimeout(function() {
    location.reload();
  }, 300000);
});
