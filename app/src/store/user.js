import { defineStore } from 'pinia'

// 用户状态：登录态 / 用户信息，持久化到本地存储
export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || null
  }),
  getters: {
    isLogin: (state) => !!state.token
  },
  actions: {
    setLogin(token, userInfo) {
      this.token = token
      this.userInfo = userInfo
      uni.setStorageSync('token', token)
      uni.setStorageSync('userInfo', userInfo)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }
  }
})