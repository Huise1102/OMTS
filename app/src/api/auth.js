import request from './request'

// 注册
export const register = (data) => request({ url: '/auth/register', method: 'POST', data })

// 登录
export const login = (data) => request({ url: '/auth/login', method: 'POST', data })