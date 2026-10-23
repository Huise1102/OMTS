// 全局错误处理中间件：兜底捕获路由抛出的异常
function errorHandler(err, req, res, next) {
  console.error('[服务器错误]', err);
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    message: err.message || '服务器内部错误',
    data: null,
  });
}

module.exports = errorHandler;