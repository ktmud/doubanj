/**
 * DEVELOPMENT Environment settings
 */
module.exports = {
  site_name: '豆瓣酱 - 开发模式',
  douban: {
    limit: 40, // request limit per minute
    key: '', // your douban api key (client_id)
    secret: '' // your douban api secret
  },
  // add more keys for douban api public information
  douban_more: [
    {
      limit: 40,
      key: '',
      secret: ''
    },
    {
      limit: 40,
      key: '',
      secret: ''
    },
    {
      limit: 40,
      key: '',
      secret: ''
    },
  ],
  //debug: false,
};
