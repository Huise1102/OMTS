import request from './request'

// 发送消息（可带 sessionId 续聊）
export const sendChat = (data) => request({ url: '/chat/chat', method: 'POST', data })

// 会话列表
export const getSessions = () => request({ url: '/chat/session' })

// 会话历史
export const getHistory = (sessionId) => request({ url: `/chat/history/${sessionId}` })

// 清空全部历史会话
export const clearSessions = () => request({ url: '/chat/session', method: 'DELETE' })