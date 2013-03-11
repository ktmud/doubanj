function realen(str) {
  var l = str.length
  return l;
}

function simple_trunc(str, limit) {
  var l = str.length;
  if (l > limit) {
    return str.slice(0, limit - 3) + '..';
  }
  return str;
}
// double width characters trunc
function trunc(str, limit, eclipsis) {
  if (typeof eclipsis === 'undefined') {
    eclipsis = '..';
  }
  var l = str.length;
  if (l * 2 < limit) return str;
  var i = 0;
  limit = limit * 2;
  while (limit > 0) {
    limit--;
    if (str.charCodeAt(i) > 2000) limit--;
    i++;
  }
  return str.slice(0, i) + (i < l ? eclipsis : '');
}

module.exports = {
  trunc: trunc,
  simple_trunc: simple_trunc,
};
