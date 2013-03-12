# Tasks for doubanj.com

All the backend data computing task

## 队列保护机制

任务开始后会加入队列（记录为其方法名和参数列表），队列会自动同步到 redis ，如果服务重启，会重新开始队列。

重新开始的任务，会在参数中收到 `_from_halt` 标记。

为了达到目的，有此约定：

  1. 每一个 task 的 module.exports 都是一系列方法名
  2. 每一个方法接受的参数一般为一个 dict object，包括 success 和 error 的回调处理
  3. 在此方法开始前使用  `module.exports.queue.safely('方法名', args)` 将任务加入队列暂存
  4. 之后只需在任务结束后正常得调用 `arg.success` 或 `arg.error` ，会自动释放队列
  4. 若任务被迫中断，重启后会使用同样的方法名和参数重新执行任务
