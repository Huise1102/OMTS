import request from './request'

// 创建订单（选座后下单）
export const createOrder = (data) => request({ url: '/order/create', method: 'POST', data })

// 模拟支付
export const payOrder = (id) => request({ url: `/order/pay/${id}`, method: 'POST' })

// 取消订单
export const cancelOrder = (id) => request({ url: `/order/cancel/${id}`, method: 'POST' })

// 退票
export const refundOrder = (id) => request({ url: `/order/refund/${id}`, method: 'POST' })

// 订单列表（status 可选）
export const getOrderList = (params) => request({ url: '/order/list', data: params })

// 订单详情（含票）
export const getOrderDetail = (id) => request({ url: `/order/detail/${id}` })

// 清除历史订单（已完成 / 已退票 / 已取消）
export const clearOrders = () => request({ url: '/order/clear', method: 'POST' })