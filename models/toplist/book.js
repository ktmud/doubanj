var central = require('../../lib/central')
var cached = require('../../lib/cached')
var getToplistKey = require('../../models/toplist').getToplistKey
var mongo = central.mongo

var User = require('../user')

var redis = central.redis
function hardest_reader(period, cb) {
  var key = getToplistKey('book', period)
  cached.get(key, cb)
}

var people_fields = { _id: 1, uid: 1, name: 1, avatar: 1, 'book_stats.all.top_tags': 1, signature: 1 }

var banned_tags = [
  '耽美', 'BL', '青春文学', '耽美小说',
  'BL漫画', '腐',
  '日本文学', '日本',
  '推理', '推理小说', '日系推理', '日本推理',
  '写真', '写真集', '摄影', 'PHOTOBOOK', '寫真',
  '绘本', '童话', '童书', '儿童文学', '图画书',
  '轻小说', '网络小说', '青春', '言情',
  '少年向', '少年漫画', '经典',
  '穿越', '武侠', '奇幻',
  '晋江', '现代都市',
  '漫画', '日本漫画', '漫畫',
  '小说', '爱情', '悬疑'
]
function is_serious_reading(tags) {
  var counter = 0
  for (var i in tags) {
    var item = tags[i]
    if (banned_tags.indexOf(item._id) !== -1) {
      counter++
      if (counter > 5) return false
    }
  }
  return true
}

function get_hardest_reader(period, cb) {
  hardest_reader(period, function(err, ids) {
    if (!ids) {
      return cb(null, [])
    }
    User.gets(ids, {
      fields: people_fields
    }, function(err, users) {
      users = users.filter(function(item, i) {
        if (item) {
          try {
            // there are useless type of books in he/she's collection
            if (is_serious_reading(item.book_stats.all.top_tags.slice(0,12))) {
              item._count = ids[i].value
              return true
            }
          } catch (e) {}
        }
        return false
      })
      cb(err, users)
    })
  })
}

exports.hardest_reader = get_hardest_reader
