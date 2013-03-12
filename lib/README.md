## central.js

会输出一个全局变量 `central` ，主要是为了方便的访问 corelib 启动后的应用程序状态，避免重复写很多 `require`

## assets.js

静态文件 url 输出辅助

## auth.js

暂时没有用到

## douban.js

扩展的 OAuth2 Client ，以方便地请求豆瓣API

## raven.js

用于向 [Sentry](https://github.com/mattrobenolt/raven-node) 发送错误消息

## task.js

利用 [node-pool](https://github.com/coopernurse/node-pool) 搭建任务队列池
