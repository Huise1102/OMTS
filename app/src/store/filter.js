import { defineStore } from 'pinia'

// 影片列表筛选状态：在「首页 → 影片列表」之间传递类型 / 关键词筛选条件
// 说明：pages/movie/list 是 tabBar 页面，只能用 uni.switchTab 跳转（无法拼 query 参数），
// 因此用 store 传递筛选条件，列表页在 onShow 时消费（consume）后应用。
export const useFilterStore = defineStore('filter', {
  state: () => ({
    pendingTypeId: '', // 待应用的类型 ID
    pendingKeyword: '', // 待应用的关键词
    needReset: false // 是否需要重置为「全部」
  }),
  actions: {
    // 跳转到影片列表并按类型筛选
    goType(id) {
      this.pendingTypeId = String(id)
      this.pendingKeyword = ''
      this.needReset = false
      uni.switchTab({ url: '/pages/movie/list' })
    },
    // 跳转到影片列表并按关键词搜索
    goSearch(keyword) {
      this.pendingKeyword = keyword
      this.pendingTypeId = ''
      this.needReset = false
      uni.switchTab({ url: '/pages/movie/list' })
    },
    // 跳转到影片列表并重置为「全部」
    goAll() {
      this.pendingTypeId = ''
      this.pendingKeyword = ''
      this.needReset = true
      uni.switchTab({ url: '/pages/movie/list' })
    },
    // 消费待应用的筛选条件（列表页 onShow 调用，调用后清空）
    consume() {
      const p = {
        typeId: this.pendingTypeId,
        keyword: this.pendingKeyword,
        needReset: this.needReset
      }
      this.pendingTypeId = ''
      this.pendingKeyword = ''
      this.needReset = false
      return p
    }
  }
})