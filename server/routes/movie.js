// 影片相关路由：轮播 / 类型 / 影院 / 推荐 / 列表 / 详情
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { ok } = require('../utils/response');

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

// 影片列表（支持状态/类型/关键词筛选 + 排序）
router.get('/list', async (req, res, next) => {
  try {
    const { status, typeId, keyword, sort } = req.query;
    let sql = 'SELECT DISTINCT m.* FROM movie m';
    const where = [];
    const params = [];
    if (typeId) {
      sql += ' JOIN movie_category mc ON mc.movie_id = m.id AND mc.category_id = ?';
      params.push(typeId);
    }
    if (status) { where.push('m.status = ?'); params.push(status); }
    if (keyword) { where.push('m.title LIKE ?'); params.push(`%${keyword}%`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    if (sort === 'rating') sql += ' ORDER BY m.rating DESC, m.box_office DESC';
    else if (sort === 'release') sql += ' ORDER BY m.release_date DESC';
    else sql += ' ORDER BY m.is_hot DESC, m.rating DESC';
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
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