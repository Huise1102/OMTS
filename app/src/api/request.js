import { BASE_URL } from '../config'

/**
 * uni.request 统一封装：
 * - 自动拼接 baseURL
 * - 自动注入 JWT Token（Authorization: Bearer xxx）
 * - 统一处理 code !== 0 错误提示
 * - 401 时清除登录态并跳转登录页
 */
function request(options = {}) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const header = { 'Content-Type': 'application/json', ...(options.header || {}) }
    if (token) header.Authorization = 'Bearer ' + token

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: 15000,
      success: (res) => {
        const { statusCode, data } = res

        // 未登录 / 登录过期
        if (statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.showToast({ title: '请先登录', icon: 'none' })
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/login' })
          }, 300)
          reject(data || { message: '未登录' })
          return
        }

        if (data && data.code === 0) {
          resolve(data.data)
        } else {
          const msg = (data && data.message) || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(data || { message: msg })
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常，请检查后端服务', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default request