// 订单相关路由：下单 / 支付 / 取消 / 退票 / 列表 / 详情
// 所有写操作均使用事务，保证座位占用与订单状态的一致性
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// 生成订单号
function genOrderNo() {
  return 'C' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// 创建订单（选座后下单，状态=待支付）
router.post('/create', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { showtimeId, seatIds } = req.body;
    const userId = req.user.id;
    if (!showtimeId || !seatIds || !seatIds.length) return fail(res, '请选择场次和座位');

    const [show] = await conn.query('SELECT * FROM showtime WHERE id = ? FOR UPDATE', [showtimeId]);
    if (!show.length) return fail(res, '场次不存在');
    const st = show[0];

    await conn.beginTransaction();
    try {
      // 校验所选座位是否已被占用
      const placeholders = seatIds.map(() => '?').join(',');
      const [occupied] = await conn.query(
        `SELECT oi.seat_id FROM order_item oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.showtime_id = ? AND oi.seat_id IN (${placeholders})
           AND oi.status = 1 AND o.status IN (1,2)`,
        [showtimeId, ...seatIds]
      );
      if (occupied.length) {
        await conn.rollback();
        return fail(res, '所选座位已被占用，请重新选择');
      }

      const total = Number(st.price) * seatIds.length;
      const orderNo = genOrderNo();
      const [orderResult] = await conn.query(
        `INSERT INTO orders(order_no, user_id, movie_id, cinema_id, hall_id, showtime_id, total_amount, ticket_qty, status)
         VALUES (?,?,?,?,?,?,?,?,0)`,
        [orderNo, userId, st.movie_id, st.cinema_id, st.hall_id, showtimeId, total, seatIds.length]
      );
      const orderId = orderResult.insertId;

      for (const seatId of seatIds) {
        await conn.query(
          'INSERT INTO order_item(order_id, showtime_id, seat_id, price) VALUES (?,?,?,?)',
          [orderId, showtimeId, seatId, st.price]
        );
      }

      await conn.commit();
      ok(res, { orderId, orderNo, totalAmount: total }, '下单成功，请尽快支付');
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  } catch (e) { next(e); }
  finally { conn.release(); }
});

// 模拟支付（状态：待支付 → 已支付，并增加已售座位数）
router.post('/pay/:id', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [order] = await conn.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!order.length) return fail(res, '订单不存在');
    const o = order[0];
    if (o.status !== 0) return fail(res, '当前订单状态不可支付');

    await conn.beginTransaction();
    try {
      await conn.query('UPDATE orders SET status = 1, paid_at = NOW() WHERE id = ?', [o.id]);
      await conn.query('UPDATE showtime SET sold_seat = sold_seat + ? WHERE id = ?', [o.ticket_qty, o.showtime_id]);
      await conn.commit();
      ok(res, null, '支付成功');
    } catch (e) { await conn.rollback(); throw e; }
  } catch (e) { next(e); }
  finally { conn.release(); }
});

// 取消订单（仅待支付可取消，释放座位）
router.post('/cancel/:id', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [order] = await conn.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!order.length) return fail(res, '订单不存在');
    const o = order[0];
    if (o.status !== 0) return fail(res, '当前订单状态不可取消');

    await conn.beginTransaction();
    try {
      await conn.query('UPDATE orders SET status = 4 WHERE id = ?', [o.id]);
      await conn.query('UPDATE order_item SET status = 0 WHERE order_id = ?', [o.id]);
      await conn.commit();
      ok(res, null, '订单已取消');
    } catch (e) { await conn.rollback(); throw e; }
  } catch (e) { next(e); }
  finally { conn.release(); }
});

// 退票（已支付/已完成可退，释放座位并回退已售数）
router.post('/refund/:id', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [order] = await conn.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!order.length) return fail(res, '订单不存在');
    const o = order[0];
    if (o.status !== 1 && o.status !== 2) return fail(res, '当前订单状态不可退票');

    await conn.beginTransaction();
    try {
      await conn.query('UPDATE orders SET status = 3 WHERE id = ?', [o.id]);
      await conn.query('UPDATE order_item SET status = 0 WHERE order_id = ?', [o.id]);
      await conn.query('UPDATE showtime SET sold_seat = GREATEST(sold_seat - ?, 0) WHERE id = ?', [o.ticket_qty, o.showtime_id]);
      await conn.commit();
      ok(res, null, '退票成功');
    } catch (e) { await conn.rollback(); throw e; }
  } catch (e) { next(e); }
  finally { conn.release(); }
});

// 我的订单列表（可按状态筛选）
router.get('/list', auth, async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `SELECT o.*, m.title AS movie_title, c.name AS cinema_name, h.name AS hall_name, s.show_date, s.show_time
               FROM orders o
               JOIN movie m ON m.id = o.movie_id
               JOIN cinema c ON c.id = o.cinema_id
               JOIN hall h ON h.id = o.hall_id
               JOIN showtime s ON s.id = o.showtime_id
               WHERE o.user_id = ?`;
    const params = [req.user.id];
    if (status !== undefined && status !== '') { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC';
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

// 订单详情（含票与座位信息）
router.get('/detail/:id', auth, async (req, res, next) => {
  try {
    const [order] = await pool.query(
      `SELECT o.*, m.title AS movie_title, c.name AS cinema_name, h.name AS hall_name, s.show_date, s.show_time
       FROM orders o
       JOIN movie m ON m.id = o.movie_id
       JOIN cinema c ON c.id = o.cinema_id
       JOIN hall h ON h.id = o.hall_id
       JOIN showtime s ON s.id = o.showtime_id
       WHERE o.id = ? AND o.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!order.length) return fail(res, '订单不存在');
    const o = order[0];
    const [items] = await pool.query(
      `SELECT oi.*, s.seat_row, s.seat_col FROM order_item oi
       JOIN seat s ON s.id = oi.seat_id WHERE oi.order_id = ?`,
      [o.id]
    );
    o.tickets = items;
    ok(res, o);
  } catch (e) { next(e); }
});

// 清除历史订单（仅删除已完成 2 / 已退票 3 / 已取消 4；待支付与已支付订单保留）
router.post('/clear', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT id FROM orders WHERE user_id = ? AND status IN (2, 3, 4)',
      [req.user.id]
    );
    if (!rows.length) return ok(res, { count: 0 }, '暂无可清除的历史订单');

    const ids = rows.map(r => r.id);
    const ph = ids.map(() => '?').join(',');
    await conn.beginTransaction();
    try {
      await conn.query(`DELETE FROM order_item WHERE order_id IN (${ph})`, ids);
      await conn.query(`DELETE FROM orders WHERE id IN (${ph})`, ids);
      await conn.commit();
      ok(res, { count: ids.length }, `已清除 ${ids.length} 条历史订单`);
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  } catch (e) { next(e); }
  finally { conn.release(); }
});

module.exports = router;