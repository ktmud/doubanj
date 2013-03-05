Do.ready(function() {
  var total = 0;
  function check(dur) {
    total += dur;

    // time out after two minutes.
    if (total > 120000) return;

    setTimeout(function() {
      $.getJSON('/api/people/' + window._uid_ + '/progress', function(d) {
        if (!d) return;
        if (d[0] + d[1] >= 100) {
          setTimeout(function() {
            window.location.reload();
          }, 500);
        } else {
          updateProgress(d);
          check((d[0] || 0) >= 70 ? 300 : 2000);
        }
      });
    }, dur || 1000);
  }
  check();

  var prog = $('#progress');
  function updateProgress(d) {
    prog.find('.progress-bar').each(function(i, item) {
      $(item).css('width', (d[i] || 0) + '%');
    });
  }
});
