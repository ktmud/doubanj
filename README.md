# [豆瓣酱](http://www.doubanj.com) [![repo dependency](https://david-dm.org/ktmud/doubanj.png)](https://david-dm.org/ktmud/doubanj)

[豆瓣](http://www.douban.com) 私人收藏数据可视化。

## 依赖

### 数据库服务器

同时依赖 mongodb 和 redis ，配置参数参见 `conf/default.conf.js` 。

### 工具包

    npm install forever -g
    npm install component -g
    npm install grunt-cli -g
    npm install

## 开始开发

    make init
    make grunt
    make

make 的默认命令是使用 `forever` 执行 `app.js` 。

如果需要修改静态文件，请执行 `make watch` ，利用 `grunt` 监视静态文件改动。

## 一点说明

### MongoDB 的用处

  1. 存储用户账户信息、收藏信息、条目信息
  2. 利用 [aggregation](http://docs.mongodb.org/manual/applications/aggregation/) 生成统计结果

### redis 的用处

  1. 替代 memcached 的缓存服务
  2. 存储统计结果（计划中）

### 队列管理

使用 [node-pool](https://github.com/coopernurse/node-pool)，数据库请求、API请求、统计请求，都有分别的队列。

### 静态文件

  - 依赖的开源库都用 component 来管理。 
  - 使用 grunt 来打包。具体配置参见 `Gruntfile.js` 。
  - 服务器递送的总是 `/static/dist` 目录下的文件，调试时也要保证 dist 目录下有所有需要的文件。没有 fallback 。因此请保证修改静态文件时，watch 有运行。

#### 客户端JS的模块化

  - static/js/do.core.js 是由豆瓣的 do.js 修改而来的文件加载器
  - 用了 component-build 的一套东西，参看 static/js/do.cmd.js
  - Gruntfile.js 里定义了对 js 文件包裹 CommonJS `require` 定义的命令
  - 使用模版配套的 `#{urlmap()}` 方法为 Do 生成所需文件的真实地址
  - 使用 `Do('module1', 'module2', ...` 显式延时加载你需要的模块，模块名即文件名，在 Do 内部安全地使用 `require('xxx')`
    具体使用实例参见 static/js/people/booter.js

#### 版本管理

发布上线前执行 `grunt build` ，将为压缩后的文件生成一个 hashmap (即 static/hash.json )，并重命名文件为 static/dist/js/xx\_HASH.js 格式。
为了保证这套机制的顺利运行，请保证新加的静态文件名中不包括下划线（\_）。
