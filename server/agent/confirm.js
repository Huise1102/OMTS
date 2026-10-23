// 写操作确认卡片构建：下单/退票不直接落库，先返回"待确认"结构，
// 由前端渲染确认卡片，用户点击"确认"后调用已有的 /api/order 接口真正执行
function buildConfirm(type, data) {
  if (type === 'create_order') {
    return {
      pending: true,
      type,
      title: '确认下单',
      summary: `场次 ${data.show_date} ${data.show_time}，座位 ${data.seat_ids.length} 个，合计 ¥${data.total.toFixed(2)}`,
      // params 与 /api/order/create 的请求体保持一致
      params: { showtimeId: data.showtime_id, seatIds: data.seat_ids },
    };
  }
  if (type === 'refund_order') {
    return {
      pending: true,
      type,
      title: '确认退票',
      summary: `订单 ${data.order_no}，退款金额 ¥${data.total_amount.toFixed(2)}`,
      // params.id 用于拼接 /api/order/refund/:id
      params: { id: data.order_id },
    };
  }
  return { pending: true, type, title: '确认操作', params: data };
}

module.exports = { buildConfirm };