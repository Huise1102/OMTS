// 统一响应格式工具：code=0 表示成功，非 0 表示失败
// 前端 uni.request 封装将根据该结构做统一拦截

function ok(res, data = null, message = 'success') {
  res.json({ code: 0, message, data });
}

function fail(res, message = '操作失败', code = 1, status = 200) {
  res.status(status).json({ code, message, data: null });
}

module.exports = { ok, fail };