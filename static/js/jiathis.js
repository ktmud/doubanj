var JIATHIS_CONFIGS = {
  webhost: "http://www.jiathis.com",
  lhost: "http://l.jiathis.com",
  _sHost: 'https://open.weixin.qq.com',
  _s: null,
  codehost: "http://v3.jiathis.com/code",
  sc: false,
  uid: 1626433,
  ckprefix: "jt_",
  jtcbk: "jtss",
  jtck: "douban,tsina,tqq,email,copy",
  custom: [],
  servicelist: {
    'jt_ishare': '一键分享,yjfx',
    'jt_ujian': '猜你喜欢,cnxh',
    'jt_copy': '复制网址,fzwz',
    'jt_fav': '收藏夹,scj',
    'jt_print': '打印,dy',
    'jt_email': '邮件,yj',
    'jt_qzone': 'QQ空间,qqkj,sns.qzone.qq.com',
    'jt_tsina': '新浪微博,xlwb,weibo.com',
    'jt_weixin': '微信,wx,weixin,weixin.qq.com',
    'jt_tqq': '腾讯微博,txwb,t.qq.com',
    'jt_tsohu': '搜狐微博,shwb,t.sohu.com',
    'jt_t163': '网易微博,wywb,t.163.com',
    'jt_renren': '人人网,rrw,www.renren.com',
    'jt_kaixin001': '开心网,kxw,www.kaixin001.com',
    'jt_googleplus': 'Google+,googlej,plus.url.google.com',
    'jt_douban': '豆瓣,db,www.douban.com',
  }
};
(function() {
  var x = document.getElementsByTagName('script');
  for (var i = 0, ci; ci = x[i++];) {
    if (/jiathis.com/.test(ci.src)) {
      JIATHIS_CONFIGS.codehost = ci.src.substring(0, ci.src.lastIndexOf("/"));
      ci.src.replace(/(uid)=([^&]+)/g, function(a, p, v) {
        JIATHIS_CONFIGS[p] = v
      })
    }
  }
  var d = document,
    isStrict = d.compatMode == "CSS1Compat",
    dd = d.documentElement,
    db = d.body,
    m = Math.max,
    ie = !! d.all,
    ua = navigator.userAgent.toLowerCase(),
    head = d.getElementsByTagName("head")[0] || dd,
    wlh = window.location.host,
    conf = (typeof(jiathis_config) == 'undefined') ? {} : jiathis_config,
    _ckpre = JIATHIS_CONFIGS.ckprefix,
    _lists = JIATHIS_CONFIGS.servicelist,
    _ref = d.referrer,
    _reced = false,
    getWH = function() {
      return {
        h: (isStrict ? dd : db).clientHeight,
        w: (isStrict ? dd : db).clientWidth
      }
    },
    getS = function() {
      return {
        t: m(dd.scrollTop, db.scrollTop),
        l: m(dd.scrollLeft, db.scrollLeft)
      }
    },
    getP = function(a) {
      var r = {
        t: 0,
        l: 0
      },
        isGecko = /gecko/.test(ua),
        add = function(t, l) {
          r.l += l, r.t += t
        },
        p = a,
        sTL = getS();
      if (a && a != db) {
        if (a.getBoundingClientRect) {
          var b = a.getBoundingClientRect();
          if (b.top == b.bottom) {
            var g = a.style.display;
            a.style.display = "block";
            b.top = b.top - a.offsetHeight;
            a.style.display = g
          }
          add(b.top + sTL.t - dd.clientTop, b.left + sTL.l - dd.clientLeft)
        } else {
          var c = d.defaultView;
          while (p) {
            add(p.offsetTop, p.offsetLeft);
            var e = c.getComputedStyle(p, null);
            if (isGecko) {
              var f = parseInt(e.getPropertyValue("border-left-width"), 10) || 0,
                bt = parseInt(e.getPropertyValue("border-top-width"), 10) || 0;
              add(bt, f);
              if (p != a && e.getPropertyValue("overflow") != "visible") {
                add(bt, f)
              }
            }
            p = p.offsetParent
          }
          p = a.parentNode;
          while (p && p != db) {
            add(-p.scrollTop, -p.scrollLeft);
            p = p.parentNode
          }
        }
      }
      return r
    },
    creElm = function(o, t, a) {
      var b = d.createElement(t || "div");
      for (var p in o) {
        p == "style" ? (b[p].cssText = o[p]) : (b[p] = o[p])
      }
      return (a || db).insertBefore(b, (a || db).firstChild)
    },
    _uniqueConcat = function(a, b) {
      var c = {};
      for (var i = 0; i < a.length; i++) {
        c[a[i]] = 1
      }
      for (var i = 0; i < b.length; i++) {
        if (!c[b[i]]) {
          a.push(b[i]);
          c[b[i]] = 1
        }
      }
      return a
    },
    _sc = function(a, b, c) {
      var d = new Date();
      d.setTime(d.getTime() + c * 1000);
      document.cookie = a + "=" + escape(b) + (c ? ";expires=" + d.toGMTString() : "") + ";path=/"
    },
    _gc = function(a) {
      var b = document.cookie;
      var c = b.indexOf(a + "=");
      if (c != -1) {
        c += a.length + 1;
        var d = b.indexOf(";", c);
        if (d == -1) {
          d = b.length
        }
        return unescape(b.substring(c, d))
      }
      return ""
    },
    _MR = function(w, d, a) {
      w /= d;
      w = Math.round(w * 10) / 10;
      if ((w + "").length >= 4) {
        w = Math.round(w)
      }
      return w + a
    },
    _FN = function(a) {
      var d = ("" + a).split(".").shift().length;
      if (isNaN(a)) {
        return '--'
      } else {
        if (d < 4) {
          return Math.round(a)
        } else {
          if (d < 7) {
            return _MR(a, 1000, "K")
          } else {
            if (d < 10) {
              return _MR(a, 1000000, "M")
            } else {
              return _MR(a, 1000000000, "B")
            }
          }
        }
      }
    },
    _rck = function(X) {
      var A = {},
        D = (new Date()).getTime(),
        E, F, G, H, V = String(X);
      if (V !== undefined && V.indexOf("|") > -1) {
        E = V.split('|');
        F = E[0];
        G = E[1];
        H = Math.floor((D - G) / 1000);
        A.shares = parseInt(F);
        A.lifetime = G;
        A.timedeff = H;
        return A
      }
      return false
    },
    _gck = function() {
      var A = _gc("jiathis_rdc"),
        B = {};
      if (A) {
        B = eval("(" + A + ")")
      }
      return B
    },
    _sck = function(U, S, T) {
      var A = _gck();
      if (A[U]) {
        delete A[U]
      }
      $CKE.shares = parseInt(S);
      A[U] = '"' + parseInt(S) + '|' + T + '"';
      _sc("jiathis_rdc", _otc(A), 0)
    },
    _otc = function(o) {
      var A = '',
        B = '';
      for (var k in o) {
        A += B + '"' + k + '":' + o[k];
        B = !B ? ',' : B
      }
      return "{" + A + "}"
    },
    _renderCounter = function(a, b) {
      for (var k in a) {
        var c = d.getElementById(a[k]);
        if (c) {
          c.title = '累计分享' + b + '次';
          c.innerHTML = _FN(b)
        }
      }
    },
    _custom = function() {
      var u = conf.services_custom;
      if (u) {
        if (!(u instanceof Array)) {
          u = [u]
        }
        for (var a = 0; a < u.length; a++) {
          var c = u[a];
          if (c.name && c.icon && c.url) {
            c.code = c.url = c.url.replace(/ /g, "");
            c.code = c.code.split("//").pop().split("?").shift().split("/").shift().toLowerCase();
            JIATHIS_CONFIGS.custom[c.code] = c;
            JIATHIS_CONFIGS.servicelist[_ckpre + c.code] = c.name + ',' + c.code + ',' + c.code
          }
        }
      }
    },
    _gw = function(a, b, c) {
      var d = "";
      do {
        d = a[b++]
      } while (b < a.length && (!_lists[_ckpre + d] || c[d]));
      if (c[d] || !_lists[_ckpre + d]) {
        d = '';
        for (var k in _lists) {
          k = k.slice(3);
          if (!c[k] && _lists[_ckpre + k]) {
            d = k;
            break
          }
        }
      }
      return d
    },
    _renderToolbox = function() {
      _custom();
      var e = conf.shareImg || {},
        hidemore = conf.hideMore || false;
      e.showType && creElm({
        src: JIATHIS_CONFIGS.codehost + "/plugin.shareimg.js",
        charset: "utf-8"
      }, "script", head);
      var f = conf.nota ? true : false;
      if (JIATHIS_CONFIGS.uid && wlh && !f) {
        var g = true;
        if (typeof(conf.nota) == 'undefined') {
          var j = ['xunlei.com', 'cnzz.com', 'taobao.com', '360.cn', 'kankan.com', 'alimama.com', 'alibaba.com', '1688.com', 'tmall.com', '360buy.com'];
          for (var k in j) {
            if (typeof(j[k]) == 'string') {
              if (wlh.match(new RegExp(j[k]))) {
                g = false;
                break
              }
            }
          }
        }
      }
      var l = "qzone,tsina,tqq,weixin,renren,kaixin001,t163,tsohu,douban,taobao,xiaoyou,msn,139,sohu,tieba,baidu,google",
        _jck = JIATHIS_CONFIGS.jtck || l,
        jck = _uniqueConcat(_jck.split(","), l.split(",")),
        parentServices = {},
        _WR = {},
        h = d.getElementsByTagName("a"),
        _url = String(conf.url || d.location),
        _CF = null,
        webid, likeid, tl, fl, bt, preferred;
      for (var i = 0, ci, tmp; ci = h[i++];) {
        if (/\bjiathis\b/.test(ci.className)) {
          ci.onmouseout = $CKE.out;
          ci.onmousemove = $CKE.move;
          !hidemore && (ci.onclick = $CKE.center);
          ci.onmouseover = $CKE.over;
          ci.hideFocus = true;
          continue
        }
        if (ci.className && (tmp = ci.className.match(/^jiathis_counter_(\w+)(?:\_|$)(.*)$/)) && tmp[1]) {
          if (typeof($CKE.containers) == "object") {
            if (!_CF) {
              _CF = creElm({
                href: JIATHIS_CONFIGS.codehost + "/css/jiathis_counter.css",
                rel: "stylesheet",
                type: "text/css"
              }, "link")
            }
            if (ci.firstChild && ci.firstChild.nodeType == 3) {
              ci.removeChild(ci.firstChild)
            }
            if (!ci.firstChild) {
              var B = tmp[1] == 'style' ? 'bubble' : tmp[1],
                C = tmp[2] ? tmp[2] : '',
                K = "jiathis_counter_" + i,
                E = d.createElement("span");
              E.className = 'jiathis_button_expanded jiathis_counter jiathis_' + B + '_style';
              !hidemore && (E.onclick = function() {
                $CKE.center()
              });
              E.id = K;
              E.appendChild(d.createTextNode("--"));
              if (C) {
                E.style.cssText = C
              }
              ci.appendChild(E)
            }
            $CKE.containers.push(K)
          }
          continue
        }
        webid = '', likeid = '', tl = false, fl = false, bt = false, preferred = false;
        if (ci.className && (tmp = ci.className.match(/^jiathis_button_([\w\.]+)(?:\s|$)/)) && tmp[1]) {
          if (tmp[1].indexOf("tools") > -1 || tmp[1].indexOf("icons") > -1) {
            if (tmp[1].indexOf("tools") > -1) {
              tl = true;
              var s = ci.className.match(/jiathis_button_tools_([0-9]+)(?:\s|$)/)
            } else {
              var s = ci.className.match(/jiathis_button_icons_([0-9]+)(?:\s|$)/)
            }
            var m = ((s && s.length) ? Math.min(16, Math.max(1, parseInt(s[1]))) : 1) - 1;
            webid = _gw(jck, m, parentServices);
            preferred = true
          } else {
            webid = tmp[1]
          }
          bt = true
        }
        if (ci.className && (tmp = ci.className.match(/^jiathis_follow_(\w+)$/)) && tmp[1]) {
          webid = tmp[1];
          fl = true
        }
        if (webid && _lists[_ckpre + webid]) {
          bt && (parentServices[webid] = 1);
          var n = function(a, b) {
              for (var c in b) {
                var o = b[c];
                if (o.preferred && o.webid == a) {
                  return c
                }
              }
              return false
            },
            key = n(webid, _WR);
          if (key !== false) {
            var T = _WR[key] || {};
            if (T.webid && T.ci) {
              TWID = _gw(jck, 0, parentServices);
              T.bt && (parentServices[TWID] = 1);
              _WR[key] = {
                "ci": T.ci,
                "webid": TWID,
                "bt": T.bt,
                "fl": T.fl,
                "tl": T.tl,
                "preferred": T.preferred
              }
            }
          }
          _WR[i] = {
            "ci": ci,
            "webid": webid,
            "bt": bt,
            "fl": fl,
            "tl": tl,
            "preferred": preferred
          }
        } else if (bt || fl) {
          ci.innerHTML = ""
        }
        if (ci.className && (tmp = ci.className.match(/^jiathis_like_(\w+)$/)) && tmp[1]) {
          likeid = tmp[1];
          var o = _gp(ci, 'data'),
            ifsrc = '',
            likeurl = _url,
            mt = '';
          if (likeid == 'qzone') {
            var p = _gv(o.qq, false);
            if (p) {
              likeurl = "http://user.qzone.qq.com/" + p;
              ifsrc = 'http://open.qzone.qq.com/like?url=' + encodeURIComponent(likeurl) + '&type=' + _gv(o.type, 'button_num')
            } else {
              ifsrc = 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_likeurl?url=' + encodeURIComponent(likeurl) + '&showcount=' + _gv(o.showcount, 1) + '&style=' + _gv(o.style, 2)
            }
          } else if (likeid == 'renren') {
            var q = _gv(o.pageid, false);
            likeurl = q ? ("http://page.renren.com/" + q) : likeurl;
            ifsrc = 'http://www.connect.renren.com/like?url=' + encodeURIComponent(likeurl) + '&showfaces=' + _gv(o.showfaces, 'false')
          } else if (likeid == 'kaixin001') {
            ifsrc = 'http://www.kaixin001.com/like/like.php?url=' + encodeURIComponent(likeurl) + '&show_faces=' + _gv(o.show_faces, 'false')
          } else if (likeid == 'tsina') {
            var r = get_des(),
              pic = '',
              isIe6 = /msie|MSIE 6/.test(navigator.userAgent),
              isIe7 = /msie|MSIE 7/.test(navigator.userAgent),
              isIe8 = /msie|MSIE 8/.test(navigator.userAgent);
            if (isIe7 || isIe6) {
              mt = 'margin-top:-15px;'
            } else {
              mt = 'margin-top:-8px;'
            }
            title = conf.title || document.title;
            r = conf.summary == undefined ? r : conf.summary;
            pic = conf.pic == undefined ? jiathis_get_pic() : conf.pic;
            url = conf.url == undefined ? document.location : conf.url;
            shost = JIATHIS_CONFIGS.codehost.replace(/(code_mini|code)/gi, '');
            url = shost + 'go.html?url=' + encodeURIComponent(url);
            ifsrc = JIATHIS_CONFIGS.codehost + '/sinalike.html?title=' + encodeURIComponent(title) + '&summary=' + encodeURIComponent(r) + '&pic=' + encodeURIComponent(pic) + '&url=' + encodeURIComponent(url)
          } else if (likeid == 'tsinat') {
            var r = get_des(),
              pic = '',
              isIe6 = /msie|MSIE 6/.test(navigator.userAgent),
              isIe7 = /msie|MSIE 7/.test(navigator.userAgent),
              isIe8 = /msie|MSIE 8/.test(navigator.userAgent);
            if (isIe7 || isIe6) {
              mt = 'margin-top:-15px;'
            } else {
              mt = 'margin-top:-8px;'
            }
            title = conf.title || document.title;
            r = conf.summary == undefined ? r : conf.summary;
            pic = conf.pic == undefined ? jiathis_get_pic() : conf.pic;
            url = conf.url == undefined ? document.location : conf.url;
            shost = JIATHIS_CONFIGS.codehost.replace(/(code_mini|code)/gi, '');
            url = shost + 'go.html?url=' + encodeURIComponent(url);
            ifsrc = JIATHIS_CONFIGS.codehost + '/sinaliket.html?title=' + encodeURIComponent(title) + '&summary=' + encodeURIComponent(r) + '&pic=' + encodeURIComponent(pic) + '&url=' + encodeURIComponent(url)
          }
          if (ifsrc) {
            ci.innerHTML = '<span class="jiathis_txt jiathis_separator jialike"><iframe src="' + ifsrc + '" allowTransparency="true" scrolling="no" border="0" frameborder="0" style="width:' + _gv(o.width, 200) + 'px;height:' + _gv(o.height, 45) + 'px;' + mt + '"></iframe></span>'
          } else {
            ci.innerHTML = ''
          }
        }
      }
      if (_WR) {
        for (var k in _WR) {
          var o = _WR[k],
            ci = o.ci,
            bt = o.bt,
            fl = o.fl,
            tl = o.tl,
            webid = o.webid;
          if (typeof(ci) == "object" && ci.innerHTML.indexOf('jtico jtico_') == -1) {
            var t = _lists[_ckpre + webid].split(',');
            var u = ci.innerHTML.replace(/^\s+|\s+$/g, "");
            var v = JIATHIS_CONFIGS.custom[webid] || {};
            var w = (v.icon) ? ' style="background:url(' + v.icon + ') no-repeat left;"' : '';
            if (tl || u) {
              u = u ? u : t[0];
              ci.innerHTML = '<span class="jiathis_txt jiathis_separator jtico jtico_' + webid + '"' + w + '>' + u + '</span>'
            } else {
              ci.innerHTML = '<span class="jiathis_txt jtico jtico_' + webid + '"' + w + '></span>'
            }
            if (fl) {
              ci.onclick = function(a) {
                return function() {
                  if (a.rel) {
                    if (a.className.match(/weixin$/)) {
                      jiathis_popup(a.rel)
                    } else {
                      window.open(a.rel, '')
                    }
                  }
                }
              }(ci);
              ci.title = ci.title ? ci.title : "在" + t[0] + "关注我们"
            } else {
              ci.onclick = function(a) {
                return function() {
                  jiathis_sendto(a)
                }
              }(webid);
              if (!ci.title) {
                if (webid == 'copy' || webid == 'print') {
                  ci.title = t[0]
                } else if (webid == 'fav') {
                  ci.title = "加入" + t[0]
                } else {
                  ci.title = "分享到" + t[0]
                }
              }
            }
          }
        }
      }
      if (_CF) {
        $CKE.counter()
      }
    },
    _gv = function(v, a) {
      if (v === undefined) {
        return a
      }
      return v
    },
    _gp = function(a, b) {
      var p = [],
        c = a.attributes[b];
      if (c) {
        o = c.nodeValue.split('&') || '';
        for (var i = o.length; i--;) {
          var j = o[i].split('=');
          p[j[0]] = j[1]
        }
      }
      return p
    },
    _rec = function(e) {
      if (!_reced) {
        if ( !! e.origin && e.origin.slice(-12) == ".jiathis.com") {
          if (e.data && e.data != "FALSE") {
            JIATHIS_CONFIGS.jtck = e.data
          }
        }
        _renderToolbox();
        _req();
        _reced = true
      }
    },
    _req = function() {
      var a, s, E = encodeURIComponent,
        o = _grf(_ref),
        T = document.title || "",
        Y = window.location.href || "",
        an = Y ? Y.indexOf(JIATHIS_CONFIGS.jtcbk) : -1,
        d1 = _gd(o.host),
        d2 = _gd(Y),
        q = null,
        f = (d1 && d2 && d1 == d2) ? false : true;
      if (an > -1) {
        a = Y.substr(an);
        q = a.split("#").pop().split("-").pop().split("=").pop();
        q = _lists[_ckpre + q] ? q : ''
      }
      q = (!q && o.webid) ? o.webid : q;
      if (q && f) {
        s = 'rsc=' + q + '&rnm=' + parseInt(JIATHIS_CONFIGS.uid) + '&rfh=' + E(o.host) + '&rfp=' + E(o.path) + '&pre=' + E(Y) + '&tit=' + escape(T);
        (new Image).src = JIATHIS_CONFIGS.lhost + "/l.gif?" + s
      }
    },
    _gd = function(o) {
      var d = null;
      if (o) {
        d = o.split(".").slice(-2).join(".");
        d = (d == "com.cn") ? o.split(".").slice(-3).join(".") : d;
        d = d.split("/").shift()
      }
      return d
    },
    _grf = function(r) {
      var h = "",
        p = "",
        q = "",
        m;
      if (r.match(/(?:[a-z]\:\/\/)([^\/\?]+)(.*)/gi)) {
        h = RegExp.$1;
        p = RegExp.$2;
        h = h ? h : "";
        p = p ? p : "";
        if (h) {
          for (var k in _lists) {
            m = _lists[k].split(',');
            if (m[2] && m[2] == h) {
              q = k.slice(3);
              break
            }
          }
        }
      }
      return {
        host: h,
        path: p,
        webid: q
      }
    },
    jiathis_utility_ifr = !! window.postMessage ? creElm({
      style: "display:none;",
      frameBorder: 0,
      src: ASSEST_ROOT + "/jiathis_utility.html"
    }, "iframe") : null,
    div = creElm({
      className: "jiathis_style",
      style: "position:absolute;z-index:1000000000;display:none;overflow:auto;"
    }),
    div1 = creElm({
      className: "jiathis_style",
      style: "position:absolute;z-index:1000000000;display:none;top:50%;left:50%;overflow:auto;"
    }),
    iframe = creElm({
      style: "position:" + (/firefox/.test(ua) ? "fixed" : "absolute") + ";display:none;filter:alpha(opacity=0);opacity:0",
      frameBorder: 0
    }, "iframe"),
    timer, inputTimer, list, clist, h, texts = {},
    clickpopjs, ckcpjs;
  $CKE = {
    jid: "",
    pop: div,
    centerpop: div1,
    shares: 0,
    containers: [],
    disappear: function(a) {
      var b = window.event || a,
        t = b.srcElement || b.target,
        tn = t.tagName ? t.tagName.toUpperCase() : "",
        c = div.contains ? div.contains(t) : !! (div.compareDocumentPosition(t) & 16),
        c1 = div1.contains ? div1.contains(t) : !! (div1.compareDocumentPosition(t) & 16),
        c2 = true;
      if (tn == "IMG") {
        c2 = t.parentNode.className.indexOf("jiathis") == "-1"
      } else if (tn == "A") {
        c2 = t.className.indexOf("jiathis") == "-1"
      } else if (tn == "SPAN") {
        c2 = t.className.indexOf("jiathis_counter") == "-1"
      }
      if (!c && !c1 && c2) {
        iframe.style.display = div1.style.display = 'none'
      }
    },
    over: function() {
      var s, T = this,
        timerCont, fn = function() {
          timerCont = setInterval(function() {
            if (div.innerHTML) {
              var p = getP(T),
                wh = getWH(),
                tl = getS();
              with(div.style) {
                display = "block";
                var a = T.style.display;
                T.style.display = "block";
                top = (p.t + T.offsetHeight + div.offsetHeight > wh.h + tl.t ? p.t - div.offsetHeight : p.t + T.offsetHeight) + "px";
                left = p.l + "px";
                T.style.display = a
              }
              with(iframe.style) {
                top = div.offsetTop + "px";
                left = div.offsetLeft + "px";
                width = div.offsetWidth + "px";
                height = div.offsetHeight + "px";
                margin = "";
                display = "block"
              }
              clearInterval(timerCont)
            }
          }, 50)
        };
      if (!clickpopjs) {
        clickpopjs = creElm({
          src: JIATHIS_CONFIGS.codehost + "/ckepop.js",
          charset: "utf-8"
        }, "script", head);
        clickpopjs.onloaded = 0;
        clickpopjs.onload = function() {
          clickpopjs.onloaded = 1;
          !ie && fn()
        };
        clickpopjs.onreadystatechange = function() {
          /complete|loaded/.test(clickpopjs.readyState) && !clickpopjs.onloaded && fn()
        }
      } else {
        fn()
      }
      return false
    },
    out: function() {
      timer = setTimeout(function() {
        div.style.display = "none";
        div1.style.display != "block" && (iframe.style.display = "none")
      }, 100)
    },
    move: function() {
      clearTimeout(timer)
    },
    center: function() {
      div.style.display = iframe.style.display = "none";
      if (!ckcpjs) {
        ckcpjs = creElm({
          src: JIATHIS_CONFIGS.codehost + "/ckecenterpop.js",
          charset: "utf-8"
        }, "script", head);
        db.style.position = "static"
      } else {
        var a = getS();
        div1.style.display = "block";
        div1.style.margin = (-div1.offsetHeight / 2 + a.t) + "px " + (-div1.offsetWidth / 2 + a.l) + "px";
        list = d.getElementById("jiathis_sharelist"), clist = list.cloneNode(true), h = clist.getElementsByTagName("input");
        for (var i = 0, ci; ci = h[i++];) {
          texts[ci.value] = ci.parentNode
        }
        with(iframe.style) {
          left = top = "50%";
          width = div1.offsetWidth + "px";
          height = div1.offsetHeight + "px";
          margin = div1.style.margin;
          display = "block"
        }
      }
      return false
    },
    choose: function(o) {
      clearTimeout(inputTimer);
      inputTimer = setTimeout(function() {
        var s = o.value.replace(/^\s+|\s+$/, ""),
          frag = d.createDocumentFragment();
        for (var p in texts) {
          eval("var f = /" + (s || ".") + "/ig.test(p)"); !! texts[p].cloneNode && (f && frag.appendChild(texts[p].cloneNode(true)))
        }
        list.innerHTML = "";
        list.appendChild(frag)
      }, 100)
    },
    centerClose: function() {
      iframe.style.display = div1.style.display = "none"
    },
    rdc: function(o) {
      if (o.shares !== undefined) {
        var A = $CKE.containers,
          B = parseInt(o.shares),
          C = String(conf.url || d.location),
          D = _gck(),
          J = _rck(D[C]),
          T = (new Date()).getTime(),
          S = B;
        if (J && J.shares > B) {
          S = J.shares
        }
        _sck(C, S, T);
        _renderCounter(A, S)
      }
    },
    counter: function() {
      var A = $CKE.containers,
        B = _gck(),
        C = String(conf.url || d.location),
        J = _rck(B[C]),
        R = true;
      if (J && J.timedeff <= 60) {
        $CKE.shares = J.shares;
        _renderCounter(A, J.shares);
        R = false
      }
      if (R) {
        creElm({
          src: "//i.jiathis.com/url/shares.php?url=" + encodeURIComponent(C),
          charset: "utf-8"
        }, "script", head)
      }
    },
    open: function(A) {
      creElm({
        src: A,
        charset: "utf-8"
      }, "script", head)
    },
    fireEvent: function(F, O) {
      if (F) {
        F = typeof(F) == "function" ? F : eval(F);
        F(O)
      }
    }
  };
  if ( !! window.addEventListener) { !! window.addEventListener && window.addEventListener("message", _rec, false)
  } else {
    if ( !! window.postMessage) {
      ( !! window.attachEvent && window.attachEvent("onmessage", _rec))
    } else {
      _renderToolbox()
    }
  }
  div.onmouseover = function() {
    clearTimeout(timer)
  };
  div.onmouseout = function() {
    $CKE.out()
  };
  ie ? d.attachEvent("onclick", $CKE.disappear) : d.addEventListener("click", $CKE.disappear, false);
  if (!conf.do_not_track && wlh && typeof(_gnayTrack) != 'object') {
    d.write('<script type="text/javascript" src="' + JIATHIS_CONFIGS.codehost + '/plugin.client.js" charset="utf-8"></script>')
  }
})();

function jiathis_sendto(a) {
  var b = get_des(),
    pic = jiathis_get_pic();
  try {
    var c = jiathis_config || {}
  } catch (e) {
    var c = {}
  };
  var d = encodeURIComponent,
    cu = JIATHIS_CONFIGS.custom[a] || {},
    U = String(c.url || document.location),
    W = "?webid=" + a,
    G = "&url=" + d(U),
    T = "&title=" + d(c.title || document.title),
    S = c.summary ? "&summary=" + d(c.summary) : (b ? "&summary=" + d(b) : ""),
    F = JIATHIS_CONFIGS.uid ? "&uid=" + parseInt(JIATHIS_CONFIGS.uid) : "",
    E = c.data_track_clickback ? "&jtss=1" : "",
    K = (c.appkey && c.appkey[a]) ? "&appkey=" + c.appkey[a] : "",
    P = c.pic ? "&pic=" + d(c.pic) : pic ? "&pic=" + d(pic) : '',
    C = $CKE.jid ? "&jid=" + $CKE.jid : "",
    R = (c.ralateuid && c.ralateuid[a]) ? "&ralateuid=" + c.ralateuid[a] : "",
    Q = (c.evt && c.evt['share']) ? c.evt['share'] : null,
    A = 'http://s.jiathis.com/',
    X = (cu.name && cu.url) ? "&acn=" + d(cu.name) + "&acu=" + d(cu.url) : "",
    B = A + W + G + T + F + E + K + P + R + S + X + C;

  // douban url hack
  if (a == 'douban') {
    B = 'http://www.douban.com/share/service?href=' + d(U) + '&comment=' + d(c.summary);
  }

  if (a == 'copy' || a == 'fav' || a == 'print' || a == 'weixin') {
    $CKE.open(B);
    if (a == 'copy') {
      jiathis_copyUrl()
    } else if (a == 'fav') {
      jiathis_addBookmark()
    } else if (a == 'weixin') {
      t = c.title || document.title;
      s = c.summary ? c.summary : (b ? b : "");
      G = G.replace('&url=', '');
      P = P.replace('&pic=', '');
      at = t + s;
      as = jiathis_SetString(at, 110);
      jiathis_sharewx(d(as + '...'), G, P, '')
    } else {
      window.print()
    }
  } else {
    window.open(B, '')
  }
  $CKE.rdc({
    shares: ($CKE.shares + 1)
  });
  $CKE.fireEvent(Q, {
    type: 'share',
    data: {
      service: a,
      url: U
    }
  });
  if ($CKE.jid) {
    var f = 'id=' + $CKE.jid + '&uid=' + JIATHIS_CONFIGS.uid + '&wid=' + a + '&u=' + d(U) + '&t=' + d(c.title || document.title) + '&time=' + new Date().getTime();
    (new Image).src = "http://lc.jiathis.com/c.gif?" + f
  }
  return false
}
function jiathis_addBookmark() {
  try {
    var d = jiathis_config || {}
  } catch (e) {
    var d = {}
  };
  var a = d.title || document.title;
  var b = d.url || parent.location.href;
  var c = window.sidebar;
  if (c && !! c.addPanel) {
    c.addPanel(a, b, "")
  } else if (document.all) {
    window.external.AddFavorite(b, a)
  } else {
    alert('请按 Ctrl + D 为你的浏览器添加书签！')
  }
}
function jiathis_copyUrl() {
  try {
    var d = jiathis_config || {}
  } catch (e) {
    var d = {}
  };
  var a = d.url || this.location.href;
  var b = d.title || document.title;
  var c = b + " " + a;
  var f = navigator.userAgent.toLowerCase();
  var g = f.indexOf('opera') != -1 && opera.version();
  var h = (f.indexOf('msie') != -1 && !g) && f.substr(f.indexOf('msie') + 5, 3);
  if (h) {
    clipboardData.setData('Text', c);
    alert("复制成功,请粘贴到你的QQ/MSN上推荐给你的好友！")
  } else if (prompt('你使用的是非IE核心浏览器，请按下 Ctrl+C 复制代码到剪贴板', c)) {
    alert('复制成功,请粘贴到你的QQ/MSN上推荐给你的好友！')
  } else {
    alert('目前只支持IE，请复制地址栏URL,推荐给你的QQ/MSN好友！')
  }
}
function jiathis_get_pic() {
  var a = document.getElementsByTagName('img'),
    pic = '',
    con = '',
    picArr = new Array();
  for (i = 0; i < a.length; i++) {
    var b = parseInt(a.item(i).offsetWidth),
      imgH = parseInt(a.item(i).offsetHeight);
    if (b > 300 && imgH > 100) {
      pic += con + a.item(i).src;
      con = ','
    }
  }
  picArr = pic.split(',');
  var c = parseInt(Math.random() * picArr.length);
  return picArr[c]
}
function get_des() {
  var a = '',
    meta = document.getElementsByTagName("meta");
  for (i = 0; i < meta.length; i++) {
    if (meta[i].name.match(/description/i)) {
      a = meta[i].content
    }
  }
  if (/msie|MSIE 6/.test(navigator.userAgent)) {
    a = ''
  }
  return a
}
function jiathis_SetString(a, b) {
  var c = 0;
  var s = "";
  for (var i = 0; i < a.length; i++) {
    if (a.charCodeAt(i) > 128) {
      c += 2
    } else {
      c++
    }
    s += a.charAt(i);
    if (c >= b) {
      return s
    }
  }
  return s
}
function jiathis_loadJs(a) {
  try {
    var x = document.createElement('SCRIPT');
    x.type = 'text/javascript';
    x.src = a;
    x.charset = 'utf-8';
    document.getElementsByTagName('head')[0].appendChild(x);
    return x
  } catch (e) {}
}
function jiathis_popup(a) {
  var b = '',
    title = '扫描二维码分享到微信';
  if (c = document.getElementById('weixin_w')) {
    c = document.getElementById('weixin_w')
  } else {
    var c = document.createElement("div");
    isIe6 = /msie|MSIE 6/.test(navigator.userAgent);
    if (!isIe6) {
      c.style.zIndex = "101120000000"
    }
    c.style.position = "absolute";
    if (isIe6) {
      c.style.left = '550px';
      c.style.top = parseInt(document.documentElement.scrollTop) + 200 + 'px';
      c.style.zIndex = "1000000"
    }
    c.id = 'weixin_w'
  }
  if (a) {
    b = a;
    title = '在微信上关注我们'
  }
  c.innerHTML = '<div class="erweimaMask" id="__weixin_share_mask_cancel_" style="z-index:10000; "></div>   <div class="containerPanel" style="z-index:10020; width:220px;_width:251px;height:248px;position:fixed;left: 41%;top:30%;-moz-border-radius:5px;-webkit-border-radius:5px;border-radius:5px;border-top:1px solid #868686;border-bottom:1px solid #212121;box-shadow:0px 1px 3px #313131;background-color:#4F5051;">    <div class="contentTitle" style="font-size:14px;height:27px;background-color:#6B6B6B;border-style:solid;border-width:1px;border-color:#6E6E6E #727272 #313233 #757575;box-shadow:0px 1px 0px #454647;-webkit-border-top-left-radius:5px;-webkit-border-top-right-radius:5px;-moz-border-radius-topleft:5px;-moz-border-radius-topright:5px;border-top-left-radius:5px;border-top-right-radius:5px;"><div class="left" style="float:left; margin-left:30px;_margin-left:15px;margin-top:2px;_margin-top:4px;color:#fff; font-weight:bold;">' + title + '</div><span class="right closeIcon" style="margin-top:2px;margin-right:10px;float:right;width:12px;display:block;"><a style="display:block;width:24px;height:24px;background:url(' + JIATHIS_CONFIGS.codehost + '/images/share_close.png) no-repeat center;" href="javascript:jiathis_cancel()" id="_weixin_share_mask_"></a></span><div class="clr" style="clear:both;overflow: hidden;"></div></div>    <div class="content" id="content" style="width:180px;_width:211px;height:180px; margin:0;padding:20px;background:none;text-align:center;background:none;"><img style="width:178px; height:178px;" src="' + a + '" id="_weixin_share_img_" /></div></div>';
  document.body.appendChild(c);
  JIATHIS_CONFIGS._oMaskEl = document.getElementById("_weixin_share_mask_");
  JIATHIS_CONFIGS._oErweimaMaskEl = document.getElementById("__weixin_share_mask_cancel_")
}
function jiathis_cancel() {
  _oDlgEl = document.getElementById('weixin_w');
  document.body.removeChild(_oDlgEl);
  _oDlgEl = _oDivEl = _oMaskEl = _oErweimaMaskEl = null
}
function jiathis_sharewx(a, b, c, d) {
  jiathis_popup('');
  _s = jiathis_loadJs(JIATHIS_CONFIGS._sHost + '/qr/set/?a=1&title=' + a + '&url=' + b + '&img=' + c + '&appid=' + (d || '') + "&r=" + Math.random());
  return false
}
function showWxBox(a) {
  document.getElementById("_weixin_share_img_").setAttribute("src", '' + JIATHIS_CONFIGS._sHost + '/qr/get/' + a + '\/')
}
