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
    export DEBUG="dbj*"
    grunt
    make


如果要修改静态文件，还需要新开进程运行

    make watch

## 一点说明

### 有关静态文件

  - 依赖的开源库都用 component 来管理。 bootstrap 除外，因为想用最新的 3.0 版本，并且有一些 font 文件是 component 暂时管不到的，所以用了 submodule 。
  - 使用 grunt 来打包。具体配置参见 `Gruntfile.js` 。
  - 服务器递送的总是 `/static/dist` 目录下的文件，调试时也要保证 dist 目录下有所有需要的文件。没有 fallback 。因此请保证修改静态文件时，watch 有运行。
