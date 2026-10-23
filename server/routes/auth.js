// 认证路由：注册 / 登录
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');
const { ok, fail } = require('../utils/response');

// 注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, nickname, phone } = req.body;
    if (!username || !password) return fail(res, '用户名和密码不能为空');
    const [exists] = await pool.query('SELECT id FROM user WHERE username = ?', [username]);
    if (exists.length) return fail(res, '用户名已存在');
    const hash = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      'INSERT INTO user(username, password, nickname, phone) VALUES (?,?,?,?)',
      [username, hash, nickname || username, phone || null]
    );
    ok(res, { id: result.insertId }, '注册成功');
  } catch (e) { next(e); }
});

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, '用户名和密码不能为空');
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    if (!rows.length) return fail(res, '用户名或密码错误');
    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password)) return fail(res, '用户名或密码错误');
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    ok(res, {
      token,
      user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar }
    }, '登录成功');
  } catch (e) { next(e); }
});

module.exports = router;