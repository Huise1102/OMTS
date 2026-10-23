<template>
  <view class="page">
    <!-- 用户信息 -->
    <view class="profile">
      <view class="profile__avatar">
        <text>{{ avatarText }}</text>
      </view>
      <view class="profile__info">
        <text class="profile__name">{{ user.isLogin ? (user.userInfo && user.userInfo.nickname) || user.userInfo.username : '未登录' }}</text>
        <text v-if="user.isLogin" class="profile__acc">{{ user.userInfo.username }}</text>
        <text v-else class="profile__acc">登录后享受购票与智能助手服务</text>
      </view>
      <view v-if="!user.isLogin" class="profile__action" @tap="goLogin">登录 / 注册</view>
    </view>

    <!-- 功能菜单 -->
    <view class="card menu">
      <view class="menu__item" @tap="goOrder"><text>我的订单</text><text class="menu__arrow">›</text></view>
      <view class="menu__item" @tap="go('/pages/guide/guide')"><text>观影指南</text><text class="menu__arrow">›</text></view>
      <view class="menu__item" @tap="go('/pages/chat/chat')"><text>智能购票助手</text><text class="menu__arrow">›</text></view>
    </view>

    <view class="card menu" v-if="user.isLogin">
      <view class="menu__item" @tap="onLogout"><text>退出登录</text></view>
    </view>

    <view class="footer">星辉影城 · 光影之间，遇见好故事</view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../../store/user'

const user = useUserStore()

const avatarText = computed(() => {
  const name = user.isLogin && user.userInfo ? (user.userInfo.nickname || user.userInfo.username) : ''
  return name ? name.charAt(0) : '星'
})

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function goOrder() {
  if (!user.isLogin) return goLogin()
  uni.switchTab({ url: '/pages/order/list' })
}

function go(url) {
  if (!user.isLogin) return goLogin()
  uni.navigateTo({ url })
}

function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        user.logout()
        uni.showToast({ title: '已退出', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped lang="scss">
.profile {
  display: flex;
  align-items: center;
  background: $brand-red;
  padding: 48rpx 32rpx;
  &__avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    color: #fff;
    text-align: center;
    line-height: 120rpx;
    font-size: 48rpx;
    font-weight: 700;
  }
  &__info { flex: 1; margin-left: 24rpx; display: flex; flex-direction: column; }
  &__name { color: #fff; font-size: 36rpx; font-weight: 700; }
  &__acc { color: rgba(255,255,255,0.85); font-size: 24rpx; margin-top: 8rpx; }
  &__action {
    color: $brand-red;
    background: #fff;
    border-radius: 30rpx;
    padding: 14rpx 32rpx;
    font-size: 26rpx;
  }
}

.menu { padding: 8rpx 24rpx; }
.menu__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $border-color;
  font-size: 28rpx;
  &:last-child { border-bottom: none; }
}
.menu__arrow { color: $text-sub; font-size: 32rpx; }

.footer { text-align: center; color: $text-sub; font-size: 22rpx; padding: 40rpx 0; }
</style>