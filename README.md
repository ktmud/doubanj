# 豆瓣酱

[豆瓣](http://www.douban.com) 私人收藏数据可视化。

## 开始开发

需要你本地运行有 `mongod` 服务，或至少提供可连接的 mongodb 数据库。
具体配置请参考 `conf/default.conf.js` 里的 `mongo` 一项。

    npm install forever -g
    npm install grunt-cli -g
    npm install bower -g 
    npm install
    make init
    make

如果要修改静态文件，还需要新开进程运行

    make watch
