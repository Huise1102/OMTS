// 场次相关路由：场次列表 / 座位图（含已售状态）
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { ok } = require('../utils/response');

// 场次列表（按影片 / 日期筛选）
router.get('/list', async (req, res, next) => {
  try {
    const { movieId, date } = req.query;
    let sql = `SELECT s.*, h.name AS hall_name, c.name AS cinema_name, m.title AS movie_title
               FROM showtime s
               JOIN hall h ON h.id = s.hall_id
               JOIN cinema c ON c.id = s.cinema_id
               JOIN movie m ON m.id = s.movie_id
               WHERE 1=1`;
    const params = [];
    if (movieId) { sql += ' AND s.movie_id = ?'; params.push(movieId); }
    if (date) { sql += ' AND s.show_date = ?'; params.push(date); }
    sql += ' ORDER BY s.show_date ASC, s.show_time ASC';
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

// 座位图：返回影厅信息 + 座位列表（含 sold 已售标记）
router.get('/seat/:showtimeId', async (req, res, next) => {
  try {
    const { showtimeId } = req.params;
    const [show] = await pool.query('SELECT * FROM showtime WHERE id = ?', [showtimeId]);
    if (!show.length) return ok(res, null, '场次不存在');
    const hallId = show[0].hall_id;

    const [hall] = await pool.query('SELECT * FROM hall WHERE id = ?', [hallId]);
    const [seats] = await pool.query(
      'SELECT * FROM seat WHERE hall_id = ? ORDER BY seat_row, seat_col',
      [hallId]
    );
    // 查询该场次已售座位（有效票且订单为已支付/已完成）
    const [sold] = await pool.query(
      `SELECT DISTINCT oi.seat_id FROM order_item oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.showtime_id = ? AND oi.status = 1 AND o.status IN (1,2)`,
      [showtimeId]
    );
    const soldSet = new Set(sold.map(s => s.seat_id));
    const layout = seats.map(s => ({ ...s, sold: soldSet.has(s.id) }));
    ok(res, { hall: hall[0], seats: layout });
  } catch (e) { next(e); }
});

module.exports = router;