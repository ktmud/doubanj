
module.exports = {
  errorHandler: require('./errorHandler'),
  navbar: function navbar(req, res, next) {
    var links = [{
      href: central.conf.site_root,
      active: req.url === '/',
      text: '首页'
    }];
    if (req.user) {
      links.push({
        href: '/user/' + req.user.uid,
        text: '我的'
      });
    }
    res.locals.navbar_links = links;
    next();
  }
};

