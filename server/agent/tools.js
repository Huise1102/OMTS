// 工具白名单：定义可供大模型调用的工具（Function Calling）
// 只读工具直接查库执行；写操作工具（下单/退票）返回"待确认"标记，
// 经前端确认后由已有 /api/order 业务接口落库，保证写操作安全
const pool = require('../config/db');
const { buildConfirm } = require('./confirm');

// 观影指南静态内容（无独立表，FAQ 形式）
const GUIDE = [
  { q: '如何取票？', a: '电影开场前，凭订单里的取票二维码到影院自助机扫码取票。' },
  { q: '可以退票吗？', a: '已支付且未开场的电影票支持在线退票，退款原路返回。' },
  { q: '儿童需要购票吗？', a: '1.3米以下儿童观影免票（不占座），一名成人限带一名儿童。' },
  { q: '观影有什么注意事项？', a: '请提前10分钟入场，观影时请将手机调至静音，保持安静。' },
];

// 工具定义（description/parameters 会直接交给模型做理解与参数抽取）
const tools = [
  {
    type: 'function',
    function: {
      name: 'query_movies',
      description: '查询/推荐影片。无参数时返回热门影片；可传 keyword 搜索片名，type 筛选类型。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '影片名称关键词，可选' },
          type: { type: 'string', description: '影片类型，如 动作/科幻/喜剧，可选' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_showtimes',
      description: '查询某影片的放映场次（时间、影厅、票价、剩余座位）。',
      parameters: {
        type: 'object',
        properties: {
          movie_id: { type: 'integer', description: '影片ID，必填' },
          date: { type: 'string', description: '场次日期 YYYY-MM-DD，可选' },
        },
        required: ['movie_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_seats',
      description: '查询某场次的座位图与已售状态。',
      parameters: {
        type: 'object',
        properties: {
          showtime_id: { type: 'integer', description: '场次ID，必填' },
        },
        required: ['showtime_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: '下单购票。必须先确定场次(showtime_id)和座位(seat_ids)。该操作需用户确认后才真正执行。',
      parameters: {
        type: 'object',
        properties: {
          showtime_id: { type: 'integer', description: '场次ID' },
          seat_ids: { type: 'array', items: { type: 'integer' }, description: '选中的座位ID数组' },
        },
        required: ['showtime_id', 'seat_ids'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_orders',
      description: '查询当前用户的订单。',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'integer', description: '订单状态：0待支付 1已支付 2已完成 3已退票 4已取消，可选' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'refund_order',
      description: '退票。需已知订单ID(order_id)。该操作需用户确认后才真正执行。',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'integer', description: '订单ID，必填' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_guide',
      description: '观影指南问答（取票、退票、儿童票、观影注意事项等）。',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '问题主题，可选' },
        },
      },
    },
  },
];

// 工具实现：只读直接查库；写操作返回待确认卡片
async function executeTool(name, args, ctx) {
  const { userId } = ctx;
  switch (name) {
    case 'query_movies': {
      let sql = 'SELECT id, title, director, actors, duration, version, rating, poster_url, status, is_hot, box_office FROM movie WHERE 1=1';
      const params = [];
      if (args.type) {
        sql += ' AND id IN (SELECT movie_id FROM movie_category mc JOIN category c ON c.id=mc.category_id WHERE c.name=?)';
        params.push(args.type);
      }
      if (args.keyword) { sql += ' AND title LIKE ?'; params.push(`%${args.keyword}%`); }
      sql += ' ORDER BY is_hot DESC, rating DESC LIMIT 10';
      const [rows] = await pool.query(sql, params);
      return rows;
    }
    case 'query_showtimes': {
      let sql = `SELECT s.id, s.show_date, s.show_time, s.version, s.price, s.total_seat, s.sold_seat,
                        h.name AS hall_name, c.name AS cinema_name
                 FROM showtime s JOIN hall h ON h.id=s.hall_id JOIN cinema c ON c.id=s.cinema_id
                 WHERE s.movie_id=?`;
      const params = [args.movie_id];
      if (args.date) { sql += ' AND s.show_date=?'; params.push(args.date); }
      sql += ' ORDER BY s.show_date ASC, s.show_time ASC';
      const [rows] = await pool.query(sql, params);
      return rows;
    }
    case 'query_seats': {
      const [show] = await pool.query('SELECT * FROM showtime WHERE id=?', [args.showtime_id]);
      if (!show.length) return { error: '场次不存在' };
      const hallId = show[0].hall_id;
      const [seats] = await pool.query(
        'SELECT id, seat_row, seat_col, seat_type FROM seat WHERE hall_id=? ORDER BY seat_row, seat_col',
        [hallId]
      );
      const [sold] = await pool.query(
        `SELECT DISTINCT oi.seat_id FROM order_item oi JOIN orders o ON o.id=oi.order_id
         WHERE oi.showtime_id=? AND oi.status=1 AND o.status IN (1,2)`,
        [args.showtime_id]
      );
      const soldSet = new Set(sold.map(s => s.seat_id));
      return seats.map(s => ({ id: s.id, row: s.seat_row, col: s.seat_col, type: s.seat_type, sold: soldSet.has(s.id) }));
    }
    case 'create_order': {
      const [show] = await pool.query('SELECT * FROM showtime WHERE id=?', [args.showtime_id]);
      if (!show.length) return { error: '场次不存在' };
      const total = Number(show[0].price) * args.seat_ids.length;
      return buildConfirm('create_order', {
        showtime_id: args.showtime_id,
        seat_ids: args.seat_ids,
        show_date: show[0].show_date,
        show_time: show[0].show_time,
        total,
      });
    }
    case 'query_orders': {
      let sql = `SELECT o.id, o.order_no, o.total_amount, o.ticket_qty, o.status, o.created_at,
                        m.title AS movie_title, s.show_date, s.show_time,
                        c.name AS cinema_name, h.name AS hall_name
                 FROM orders o JOIN movie m ON m.id=o.movie_id
                 JOIN showtime s ON s.id=o.showtime_id
                 JOIN cinema c ON c.id=o.cinema_id
                 JOIN hall h ON h.id=o.hall_id
                 WHERE o.user_id=?`;
      const params = [userId];
      if (args.status !== undefined && args.status !== null && args.status !== '') {
        sql += ' AND o.status=?';
        params.push(args.status);
      }
      sql += ' ORDER BY o.created_at DESC LIMIT 10';
      const [rows] = await pool.query(sql, params);
      return rows;
    }
    case 'refund_order': {
      const [order] = await pool.query('SELECT * FROM orders WHERE id=? AND user_id=?', [args.order_id, userId]);
      if (!order.length) return { error: '订单不存在或不属于当前用户' };
      const o = order[0];
      if (o.status !== 1 && o.status !== 2) return { error: '该订单当前状态不可退票' };
      return buildConfirm('refund_order', {
        order_id: o.id,
        order_no: o.order_no,
        total_amount: Number(o.total_amount),
      });
    }
    case 'query_guide': {
      let result = GUIDE;
      if (args.topic) {
        result = GUIDE.filter(g => g.q.includes(args.topic) || g.a.includes(args.topic));
      }
      return result;
    }
    default:
      return { error: `未知工具 ${name}` };
  }
}

module.exports = { tools, executeTool };