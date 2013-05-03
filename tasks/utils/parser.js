var moment = require('moment');

function dbc2sbc(str) {
  return str.replace(/[\uff01-\uff5e]/g,function(a){return String.fromCharCode(a.charCodeAt(0)-65248);}).replace(/\u3000/g," ");
}

var reg_chinese_yen = /^[\s￥]*[\d\,，\.]元?$/;
var currency_trans = [
  [/^\s*(USD?\$?|\$)[\.\s]*/i, 6.23],
  [/^\s*(HKD?\$?|港币)[\.\s]*/i, 0.8],
  [/^\s*(CNY|￥)\s*/i, 1],
  [/^\s*(GBP?\£?|\£)[\.\s]*/i, 9.44],
  [/(NTD?|TWD?|新?台币)\$?/i, 0.21],
  [/(円|[\(（]?税込[\(）]?|日元)/i, 0.07],
  [/^\s*JPY\s*/i, 0.07],
  [/^\s*(CDN|CAD)[\.\s]*\$?\s*/i, 6.1]
];
function parse_price(price) {
  price = price || '';
  price = price.trim();

  if (!price) return null;

  price = dbc2sbc(price).replace(/[,，]/g, '');

  var n = parseFloat(price, 10);
  if (!isNaN(n) && reg_chinese_yen.test(price)) return n;

  for (var i = 0, l = currency_trans.length; i < l; i++) {
    var item = currency_trans[i];
    if (item[0].test(price)) {
      var replaced = price.replace(item[0], '');
      //console.log(replaced);
      //console.log('%s replaced to %s', price, replaced);
      return parseFloat(replaced, 10) * item[1];
    }
  }
  if (isNaN(n)) return n;

  return n;
}

function parse_pages(pages) {
  if (!pages || pages.search('册') > -1) return null;
  pages = pages.replace(/^\s*大?约\s*/, '');
  pages = dbc2sbc(pages);
  var n = parseInt(pages, 10);
  if (isNaN(n)) return null;
  return n;
}

//function isDigit(str) {
  //return /^\d+$/.test(str);
//}
//function parse_date(str) {
  //var d = str || '';

  //d = dbc2sbc(d);

  //var i = 0;
  //d = d.trim().replace(/[\s\-、\,－]+/g, function(m) {
    //i++;
    //if (i > 2) {
      //return ' ';
    //}
    //return '-';
  //}).replace(/[^0-9\-\s\:a-zA-Z]/g, '');

  //var r;
  //if (isDigit(d)) {
    //var _d = [d.slice(0, 4), d.slice(4, 6) || 1, d.slice(6) || 1].join('-');
    //r = new Date(_d);
    //if (isNaN(+r)) {
      //d = [d.slice(0, 4), d.slice(4, 5) || 1, d.slice(5) || 1].join('-');
    //} else {
      //if　(r.getFullYear() > 3000) {
        //// 890606
        //d = [d.slice(0,2), d.slice(2,4) || 1, d.slice(4, 6) || 1].join('-');
      //}
      //d = _d;
    //}
  //}

  //r = new Date(d);
  //if (isNaN(+r)) return null;
  //return r;
//}
var chinese_nums = '十二 十一 十 九 八 七 六 五 四 三 二 一'.split(' ');
var reg_chinese = new RegExp(chinese_nums.join('|'));
var reg_minguo = /民国?(\d+)/;
function normalize_date(d) {
  d = d || '';
  d = dbc2sbc(d);
  if (reg_chinese.test(d)) {
    chinese_nums.forEach(function(item, i) {
      var m = 12 - i;
      if (m == 10) {
        d = d.replace(item + '年', '0年');
        d = d.replace(item + '月', '10月');
        d = d.replace(item + '日', '0日');
      } else {
        d = d.replace(new RegExp(item, 'g'), m);
      }
    });
  }
  // 民国年份需要加上1911年
  if (reg_minguo.test(d)) {
    d = d.replace(reg_minguo, function(p0, p1) {
      return +p1 + 1911;
    });
  }
  return d;
};
var date_formats = [
  'YYYY-MM-DD',
  'YYYYMMDD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'MMM DD, YYYY',
  'DD MMM, YYYY',
  'YYYY-MM',
  'YY-MM-DD',
  'YYMMDD',
  'DD/MM/YY',
  'MM/DD/YY',
  'YYYY',
  'YY-MM',
  'YYMM',
  'YY'
];
var this_year = (new Date()).getFullYear();
var next_decade = this_year + 10;
var next_year = this_year + 1;
function parse_pubdate(d) {
  var _d = d;
  d = normalize_date(_d);

  if (!d) return null;

  var i = 0, l = date_formats.length;
  var ret = null, f, mo, y;
  for (;i < l;i++) {
    f = date_formats[i];
    mo = moment(d, f);
    if (!mo) return null;
    y = mo.year();
    if (mo.isValid() && y > 800 && y < next_year) {
      //if (y > next_year) {
        //console.log('Possible invalid date', _d, d, f, mo.toDate());
      //}
      ret = mo.toDate();
      //console.log(d, f, ret);
      break;
    }
  }
  //console.log(d, ret);
  return ret;
}
function parse_publisher(p) {
  if (!p) return null;
  return p;
}

function parse_people(people) {
  if (!people || !people.length) return null;
  return people.filter(function(item) {
    return item !== '等';
  });
}

module.exports = {
  'publisher': parse_publisher,
  'pubdate': parse_pubdate,
  'author': parse_people,
  'translator': parse_people,
  'pages': parse_pages,
  'price': parse_price,
};

