// 模拟真实售票：每天定时为未来场次随机占用一部分座位
// 占用方式为真实落库（系统账号下单，订单状态=已完成），因此座位图、余票、下单校验全部自动生效
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const SYSTEM_USERNAME = 'system_booking'; // 系统占座账号，不用于登录
const MIN_RATE = 0.10; // 起售率下限（10%）
const MAX_RATE = 0.45; // 起售率上限（45%）
const KEEP_FREE = 4; // 每场至少保留的空位数，保证总有座位可选
const GROUP_MAX = 4; // 单笔订单最多连座数
const DAILY_HOUR = 2; // 每天 02:00 执行

// 固定种子的伪随机数，保证同一天重复执行结果一致（幂等）
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daySeed(showtimeId, date) {
  const d = String(date).replace(/-/g, '');
  return showtimeId * 131 + Number(d);
}

function genOrderNo(seq) {
  return 'S' + Date.now().toString(36).toUpperCase() + String(seq).padStart(4, '0');
}

// 获取或创建系统占座账号
async function ensureSystemUser(conn) {
  const [rows] = await conn.query('SELECT id FROM user WHERE username = ?', [SYSTEM_USERNAME]);
  if (rows.length) return rows[0].id;
  const pwd = bcrypt.hashSync(require('crypto').randomBytes(12).toString('hex'), 10);
  const [r] = await conn.query(
    'INSERT INTO user(username, password, nickname, status) VALUES (?,?,?,0)',
    [SYSTEM_USERNAME, pwd, '系统占座']
  );
  return r.insertId;
}

// 优先挑选同排连座，找不到连座则随机挑
function pickSeats(freeSeats, n, rand) {
  const byRow = new Map();
  for (const s of freeSeats) {
    if (!byRow.has(s.seat_row)) byRow.set(s.seat_row, []);
    byRow.get(s.seat_row).push(s);
  }
  const candidates = [];
  for (const arr of byRow.values()) {
    arr.sort((a, b) => a.seat_col - b.seat_col);
    for (let i = 0; i + n <= arr.length; i++) {
      let ok = true;
      for (let k = 1; k < n; k++) {
        if (arr[i + k].seat_col !== arr[i + k - 1].seat_col + 1) { ok = false; break; }
      }
      if (ok) candidates.push(arr.slice(i, i + n));
    }
  }
  if (candidates.length) return candidates[Math.floor(rand() * candidates.length)];

  const pool2 = freeSeats.slice();
  for (let i = pool2.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool2[i], pool2[j]] = [pool2[j], pool2[i]];
  }
  return pool2.slice(0, n);
}

// 为单个场次补足已售座位
async function occupyShowtime(conn, st, systemUserId, seqRef) {
  const rand = mulberry32(daySeed(st.id, st.show_date));

  const [seats] = await conn.query(
    'SELECT id, seat_row, seat_col FROM seat WHERE hall_id = ? AND status = 1 ORDER BY seat_row, seat_col',
    [st.hall_id]
  );
  if (!seats.length) return 0;

  const [sold] = await conn.query(
    `SELECT DISTINCT oi.seat_id FROM order_item oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.showtime_id = ? AND oi.status = 1 AND o.status IN (1,2)`,
    [st.id]
  );
  const soldSet = new Set(sold.map(s => s.seat_id));

  const total = seats.length;
  const maxSold = Math.max(total - KEEP_FREE, 0);
  const target = Math.min(
    Math.max(Math.round(total * (MIN_RATE + rand() * (MAX_RATE - MIN_RATE))), 4),
    maxSold
  );

  let need = target - soldSet.size;
  if (need <= 0) return 0;

  const freeSeats = seats.filter(s => !soldSet.has(s.id));
  need = Math.min(need, freeSeats.length);
  if (need <= 0) return 0;

  let added = 0;
  let free = freeSeats;
  while (added < need && free.length) {
    const qty = Math.min(1 + Math.floor(rand() * GROUP_MAX), need - added, free.length);
    const picked = pickSeats(free, qty, rand);
    if (!picked.length) break;

    const ids = new Set(picked.map(s => s.id));
    free = free.filter(s => !ids.has(s.id));

    const amount = (Number(st.price) * picked.length).toFixed(2);
    const [orderResult] = await conn.query(
      `INSERT INTO orders(order_no, user_id, movie_id, cinema_id, hall_id, showtime_id,
                          total_amount, ticket_qty, status, created_at, paid_at)
       VALUES (?,?,?,?,?,?,?,?,2, NOW(), NOW())`,
      [genOrderNo(++seqRef.n), systemUserId, st.movie_id, st.cinema_id, st.hall_id, st.id, amount, picked.length]
    );
    for (const seat of picked) {
      await conn.query(
        'INSERT INTO order_item(order_id, showtime_id, seat_id, price, status) VALUES (?,?,?,?,1)',
        [orderResult.insertId, st.id, seat.id, st.price]
      );
    }
    added += picked.length;
  }

  if (added > 0) {
    await conn.query(
      'UPDATE showtime SET sold_seat = ? WHERE id = ?',
      [soldSet.size + added, st.id]
    );
  }
  return added;
}

// 执行一次占座任务
async function run() {
  const conn = await pool.getConnection();
  const startedAt = Date.now();
  try {
    const [showtimes] = await conn.query(
      `SELECT s.* FROM showtime s
       WHERE s.status = 1
         AND (s.show_date > CURDATE() OR (s.show_date = CURDATE() AND s.show_time > CURTIME()))
       ORDER BY s.show_date, s.show_time`
    );
    if (!showtimes.length) {
      console.log('[占座任务] 没有可售场次，跳过');
      return { showtimes: 0, seats: 0 };
    }

    const systemUserId = await ensureSystemUser(conn);
    const seqRef = { n: 0 };
    let seatCount = 0;
    let touched = 0;

    await conn.beginTransaction();
    try {
      for (const st of showtimes) {
        const added = await occupyShowtime(conn, st, systemUserId, seqRef);
        if (added > 0) { seatCount += added; touched++; }
      }
      // 校正已售计数（历史订单删除等情况下 sold_seat 可能失真）
      await conn.query(
        `UPDATE showtime s SET s.sold_seat = (
           SELECT COUNT(*) FROM order_item oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.showtime_id = s.id AND oi.status = 1 AND o.status IN (1, 2)
         )`
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }

    const cost = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[占座任务] 完成：${touched}/${showtimes.length} 场有新增占用，共占用 ${seatCount} 个座位，耗时 ${cost}s`);
    return { showtimes: showtimes.length, seats: seatCount };
  } finally {
    conn.release();
  }
}

// 每天定时执行（服务启动时先跑一次，保证演示数据即时生效）
function scheduleDaily(hour = DAILY_HOUR, minute = 0) {
  const nextDelay = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  };
  const tick = async () => {
    try {
      await run();
    } catch (e) {
      console.error('[占座任务] 执行失败:', e.message);
    }
    setTimeout(tick, nextDelay());
  };
  setTimeout(tick, nextDelay());
  console.log(`[占座任务] 已启动，每天 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} 自动执行`);
}

module.exports = { run, scheduleDaily };

// 支持手动执行：node jobs/occupySeats.js
if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
}
