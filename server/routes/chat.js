// 智能对话路由：发送消息 / 会话列表 / 会话历史
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { chat } = require('../agent/agent');

// 发送消息（需登录）
router.post('/chat', auth, async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return fail(res, '请输入消息内容');
    const userId = req.user.id;

    let sid = sessionId;
    if (!sid) {
      sid = uuidv4();
      await pool.query('INSERT INTO chat_session(session_id, user_id, title) VALUES (?,?,?)', [sid, userId, message.slice(0, 20)]);
    }
    const result = await chat({ sessionId: sid, userId, message });
    ok(res, { sessionId: sid, ...result });
  } catch (e) { next(e); }
});

// 获取当前用户的会话列表
router.get('/session', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM chat_session WHERE user_id=? ORDER BY updated_at DESC', [req.user.id]);
    ok(res, rows);
  } catch (e) { next(e); }
});

// 获取某会话历史消息
router.get('/history/:sessionId', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT role, content FROM chat_message WHERE session_id=? AND role IN ('user','assistant') ORDER BY id ASC", [req.params.sessionId]);
    ok(res, rows);
  } catch (e) { next(e); }
});

// 清空当前用户全部历史会话（会话 + 消息）
router.delete('/session', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT session_id FROM chat_session WHERE user_id=?', [req.user.id]);
    const ids = rows.map(r => r.session_id);

    await conn.beginTransaction();
    if (ids.length) {
      await conn.query('DELETE FROM chat_message WHERE session_id IN (?)', [ids]);
      await conn.query('DELETE FROM chat_session WHERE user_id=?', [req.user.id]);
    }
    await conn.commit();
    ok(res, { count: ids.length });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

module.exports = router;