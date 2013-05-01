Do('lodash', function() {
  var lodash = require('lodash')._;
  var tmpl_friends = lodash.template($('#tmpl-friends').html());
  var tmpl_friends_items = lodash.template($('#tmpl-friends-items').html());

  var uid = window._uid_;

  var API_FOLLOWINGS = '/api/mine/followings';

  function preprocess(items) {
    lodash.each(items, function(item) {
      item.url = '/people/' + item.uid + '/';
    });
  }

  var followings = $('#followings');

  var start = 48, limit = 24;

  function first_pull() {
    $.getJSON(API_FOLLOWINGS, { limit: start }, function(res, err) {
      if (res.r) {
        if (res.msg === 'pulling') {
          res.msg === '同步正在进行..';
          setTimeout(pull, 10000);
        }
        followings.find('.alert').addClass('alert-error').html(res.msg || '出错啦!');
        return;
      }
      if (res.items) {
        preprocess(res.items);
      }
      followings.html(tmpl_friends(res));
    });
  }
  first_pull();

  followings.delegate('.btn-more', 'click', function(e) {

    e.preventDefault();

    var node = $(this);
    if (node.hasClass('disabled')) return;

    node.addClass('disabled').html('加载中...');

    $.getJSON(API_FOLLOWINGS, { start: start, limit: limit }, function(res, a) {
      start += limit;
      if (res.r) {
        node.remove();
        alert('出错啦！' + res.msg);
        return;
      }
      if (res.items) {
        preprocess(res.items);
      }
      if (res.items.length < limit) {
        node.html('没有更多了');
      } else {
        node.removeClass('disabled').html('加载更多友邻');
      }
      followings.find('ul').append(tmpl_friends_items(res));
    });
  });
});
