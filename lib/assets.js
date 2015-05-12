/**
* Static Assets files management
*/
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var istatic = require('express-istatic');
var cwd = process.cwd();
var conf = require(cwd + '/conf');

var root = cwd + '/static/dist';

var reg_log = /_log\(.*?\);/g;
istatic.default({
  root: root,
  debug: conf.debug,
  compress: !conf.debug,
  ttl: conf.debug ? 0 : 60 * 60 * 24 * 7,
  fresh: conf.debug,
  js: {
    filter: function(str) {
      return str.replace(reg_log, '');
    }
  }
});

var hash_cache = {};
try {
  hash_cache = require(cwd + '/static/hash.json');
} catch (e) {
  if (e.code == 'MODULE_NOT_FOUND') {
    console.error('No existing static hashmap.');
  } else {
    throw e;
  }
  //console.trace(e);
}

var reg_css_js = /\.(css|js)$/;

function fileUrl(p) {
  if (p[0] == '/') p = p.slice(1);
  if (conf.debug || !reg_css_js.test(p)) return conf.assets_root + '/' + p;

  var hash = hash_cache[p];
  if (hash) {
    var ext = path.extname(p);
    p = path.join(path.dirname(p), path.basename(p, ext) + '_' + hash + ext);
  }
  return conf.assets_root + '/' + p;
}

function urlMap() {
  var files = [].slice.call(arguments);
  var ret = {};
  files.forEach(function(f) {
    if (!path.extname(f)) f = path.join('js', f + '.js');
    ret[conf.assets_root + '/' + f] = fileUrl(f);
  });
  return ret;
}

function readFile(filepath, encoding) {
  var contents = '';
  try {
    contents = fs.readFileSync(String(filepath), encoding);
  } catch (e) {}
  return contents;
}
function md5(contents) {
  var shasum = crypto.createHash('md5');
  shasum.update(contents);
  return shasum.digest('hex').slice(0, 10);
}

// pass in some static files, get their hash value
function hashMap() {
  var files = [].slice.call(arguments);
  var ret = {};
  files.forEach(function(f) {
    ret[f] = getHash(f.indexOf('.') == -1 ? 'js/' + f + '.js' : f);
  });
  return ret;
}
function getHash(f, fresh, r, encoding){
  r = typeof r !== 'string' ? root : r;
  return fresh ? (hash_cache[f] = md5(readFile(path.join(r, f), encoding))) : hash_cache[f];
}

module.exports = {
  root: root,
  istatic: istatic,
  hashMap: hashMap,
  urlMap: urlMap,
  getHash: getHash,
  fileUrl: fileUrl
};
