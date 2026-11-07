// 待支付订单超时取消：每 5 分钟扫描一次，释放锁定的座位
const pool = require('../config/db');

const INTERVAL = 5 * 60 * 1000; // 5 分钟

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    try {
      const [rows] = await conn.query(
        'SELECT id FROM orders WHERE status = 0 AND expire_at IS NOT NULL AND expire_at <= NOW() FOR UPDATE'
      );
      if (!rows.length) {
        await conn.commit();
        return { count: 0 };
      }

      const ids = rows.map(r => r.id);
      const ph = ids.map(() => '?').join(',');
      await conn.query(`UPDATE orders SET status = 4 WHERE id IN (${ph})`, ids);
      await conn.query(`UPDATE order_item SET status = 0 WHERE order_id IN (${ph})`, ids);
      await conn.commit();
      console.log(`[超时取消] 已取消 ${ids.length} 笔待支付订单`);
      return { count: ids.length };
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  } finally {
    conn.release();
  }
}

// 启动时由调用方执行一次，之后每 5 分钟执行
function schedule() {
  const tick = async () => {
    try {
      await run();
    } catch (e) {
      console.error('[超时取消] 执行失败:', e.message);
    }
    setTimeout(tick, INTERVAL);
  };
  setTimeout(tick, INTERVAL);
  console.log('[超时取消] 已启动，每 5 分钟检查一次待支付订单');
}

module.exports = { run, schedule };

// 支持手动执行：node jobs/cancelExpiredOrders.js
if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
}
