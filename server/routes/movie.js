// 影片相关路由：轮播 / 类型 / 影院 / 推荐 / 列表 / 详情
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

// 轮播图列表
router.get('/banner', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banner WHERE status = 1 ORDER BY sort ASC');
    ok(res, rows);
  } catch (e) { next(e); }
});

// 影片类型列表
router.get('/category', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM category ORDER BY sort ASC');
    ok(res, rows);
  } catch (e) { next(e); }
});

// 影院列表
router.get('/cinema', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cinema ORDER BY id ASC');
    ok(res, rows);
  } catch (e) { next(e); }
});

// 热映推荐（热门 + 评分 + 票房 排序）
router.get('/hot', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM movie WHERE status = 1 ORDER BY is_hot DESC, rating DESC, box_office DESC LIMIT 10'
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

// 转义 LIKE 通配符，避免 % _ 影响匹配结果
function escapeLike(str) {
  return String(str).replace(/[%_]/g, ch => '\\' + ch);
}

// 影片列表（支持状态/类型/关键词筛选 + 排序）
router.get('/list', async (req, res, next) => {
  try {
    const { status, typeId, sort } = req.query;
    const keyword = (req.query.keyword || '').trim().slice(0, 20);
    let sql = 'SELECT DISTINCT m.* FROM movie m';
    const where = [];
    const params = [];
    if (typeId) {
      sql += ' JOIN movie_category mc ON mc.movie_id = m.id AND mc.category_id = ?';
      params.push(typeId);
    }
    if (status) { where.push('m.status = ?'); params.push(status); }
    if (keyword) {
      // 片名 / 导演 / 主演 同时匹配
      const kw = `%${escapeLike(keyword)}%`;
      where.push('(m.title LIKE ? OR m.director LIKE ? OR m.actors LIKE ?)');
      params.push(kw, kw, kw);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    if (sort === 'rating') sql += ' ORDER BY m.rating DESC, m.box_office DESC';
    else if (sort === 'release') sql += ' ORDER BY m.release_date DESC';
    else sql += ' ORDER BY m.is_hot DESC, m.rating DESC';
    // 可选分页：不传 pageSize 时保持原有返回全部影片的行为
    const pageSize = parseInt(req.query.pageSize, 10);
    const page = parseInt(req.query.page, 10);
    if (pageSize > 0) {
      const p = page > 0 ? page : 1;
      sql += ` LIMIT ${pageSize} OFFSET ${(p - 1) * pageSize}`;
    }
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (e) { next(e); }
});

// ==================== 收藏（想看） ====================

// 我的收藏列表
router.get('/favorite/list', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.id, f.movie_id AS movieId, f.created_at, m.title, m.rating, m.version,
              m.status, m.release_date
       FROM favorite f
       JOIN movie m ON m.id = f.movie_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    ok(res, rows);
  } catch (e) { next(e); }
});

// 查询单部影片的收藏状态
router.get('/favorite/status/:movieId', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id FROM favorite WHERE user_id = ? AND movie_id = ?',
      [req.user.id, req.params.movieId]
    );
    ok(res, { favorited: rows.length > 0 });
  } catch (e) { next(e); }
});

// 收藏（重复收藏不产生重复数据）
router.post('/favorite/:movieId', auth, async (req, res, next) => {
  try {
    const [movie] = await pool.query('SELECT id FROM movie WHERE id = ?', [req.params.movieId]);
    if (!movie.length) return fail(res, '影片不存在');
    await pool.query(
      'INSERT IGNORE INTO favorite(user_id, movie_id) VALUES (?,?)',
      [req.user.id, req.params.movieId]
    );
    ok(res, { favorited: true }, '已加入想看');
  } catch (e) { next(e); }
});

// 取消收藏
router.delete('/favorite/:movieId', auth, async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM favorite WHERE user_id = ? AND movie_id = ?',
      [req.user.id, req.params.movieId]
    );
    ok(res, { favorited: false }, '已取消想看');
  } catch (e) { next(e); }
});

// 影片详情（含类型标签）
router.get('/detail/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM movie WHERE id = ?', [req.params.id]);
    if (!rows.length) return ok(res, null, '影片不存在');
    const movie = rows[0];
    const [cats] = await pool.query(
      'SELECT c.name FROM category c JOIN movie_category mc ON mc.category_id = c.id WHERE mc.movie_id = ?',
      [movie.id]
    );
    movie.categories = cats.map(c => c.name);
    ok(res, movie);
  } catch (e) { next(e); }
});

module.exports = router;