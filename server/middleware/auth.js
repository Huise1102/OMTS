// JWT 鉴权中间件：解析请求头中的 Token，校验通过后把用户信息挂到 req.user
const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return fail(res, '未登录', 401, 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username }
    next();
  } catch (e) {
    return fail(res, '登录已过期，请重新登录', 401, 401);
  }
}

module.exports = auth;