Do.ready(function() {

  var datetime = require('utils/datetime');
  var prog = $('#progress');
  var remains = $('#remains');
  var ad = false; // 是否附上捐赠广告

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

        updateRemains(d);

        if (d.stats_status && d.stats_status !== 'ing') {
          setTimeout(function() {
            window.location.reload();
          }, 3000);
          return;
        }

        if (d.remaining < 300000) {
          check(d.interval || 5000);
        }
      });
    }, dur || 3000);
  }
  check();

  function updateProgress(d) {
    prog.find('.progress-bar').each(function(i, item) {
      $(item).css('width', (d[i] || 0) + '%');
    });
  }

  function updateRemains(d) {
    var t = d.remaining;
    var text = '';

    ad = !ad;

    if (d.book_synced_n < d.book_n) {
      text = '<p class="small">'
      text += '已同步 ' + d.book_synced_n + '/' + d.book_n + ' 本图书收藏，';
      if (d.queue_length > 2) {
        text += '共有' + d.queue_length + '人同时在排队';
      }
    }

    if (t > 60000) {
      text += '<p>预计还需要' + datetime.mili2chinese(t, true) + '左右';
    } else if (t > 5000) {
      text += '<p>只剩下大概' + datetime.mili2chinese(t);
    } else if (t) {
      text = '马上就好';
    }
    text = text || '<p>同步仍在进行，请耐心等待..</p>';
    if (ad) {
      text += '<p class="small">太慢了? <a href="/donate">捐点钱让服务器更快!</a>'
    }
    remains.html(text);
  }

  // refresh page after five minutes, no matter what
  setTimeout(function() {
    location.reload();
  }, 300000);
});
