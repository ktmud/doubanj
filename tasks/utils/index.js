var raven = require('../../lib/raven');

var normalize_status = {
  'reading': 'ing',
  'read': 'done',
  'wish': 'wish',
};
function norm_status(s) {
  return normalize_status[s];
}

var parsers = require('./parser');
function norm_subject(s, ns) {
  s._id = String(s.id);
  delete s.id;

  if (ns) {
    s.type = ns;
  } else if ('book_id' in s) {
    s.type = book;
  }
  var k, oril
  for (k in parsers) {
    if (k in s) {
      ori = s['ori_' + k] = s[k]; // backup original value
      s[k] = parsers[k](s[k]);
      if (s[k] && ori && s[k] === null) {
        console.log('invalid %s %s', k, ori); 
        raven.message('invalid %s %s', k, ori, {
          tags: { parsing: k },
          extra: {
            subject_id: s._id
          },
          level: 'warn'
        });
      }
    }
  }
  if (s.rating) {
    s.raters = s.rating.numRaters;
    // zero is ignored
    s.rated = parseFloat(s.rating.average, 10) || null;
  }
  return s;
}
function norm_interest(i) {
  i._id = String(i.id);
  delete i.id;

  i.status = normalize_status[i.status];
  i.commented = i.comment && i.comment.length || null;
  i['updated'] = new Date(i['updated']);
  return i;
}

var time_funcs = {
  year: function(date) { return date.getFullYear() + '' },
  month: function(date) { return date.getFullYear() + '-' + date.getMonth() },
  monthday: function(date) { return date.getDate() + '' },
  weekday: function(date) { return date.getDay() + '' },
  hour: function(date) { return date.getHours() + '' },
};

module.exports = {
  parsers: parsers,
  norm_subject: norm_subject,
  norm_interest: norm_interest,
  time_funcs: time_funcs
};
