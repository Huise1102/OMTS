// 通用工具函数

// 订单状态文案
export function orderStatus(status) {
  const map = { 0: '待支付', 1: '已支付', 2: '已完成', 3: '已退票', 4: '已取消' }
  return map[status] ?? '未知'
}

// 订单状态颜色
export function orderStatusColor(status) {
  const map = { 0: '#FF8F1F', 1: '#07C160', 2: '#2B7CF6', 3: '#8A8A8A', 4: '#8A8A8A' }
  return map[status] ?? '#8A8A8A'
}

// 时间格式化为 HH:mm（去掉秒）
export function fmtTime(t) {
  return t ? String(t).slice(0, 5) : ''
}

// 评分格式化（DECIMAL 返回为字符串）
export function fmtRating(r) {
  return Number(r || 0).toFixed(1)
}

// 金额格式化（保留两位小数）
export function fmtPrice(p) {
  return Number(p || 0).toFixed(2)
}

// 未来 n 天日期数组（供场次日期选择）
export function nextDates(n = 7) {
  const week = ['日', '一', '二', '三', '四', '五', '六']
  const list = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    list.push({
      date: `${y}-${m}-${day}`,
      label: i === 0 ? '今天' : i === 1 ? '明天' : `${m}/${day}`,
      week: '周' + week[d.getDay()]
    })
  }
  return list
}