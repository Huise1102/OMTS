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
/* ---------- 用户信息头 ---------- */
.profile {
  display: flex;
  align-items: center;
  padding: 52rpx $sp-lg 76rpx;
  background: linear-gradient(160deg, #F6EDE2 0%, #FBF1DD 60%, $bg-color 100%);

  &__avatar {
    position: relative;
    flex-shrink: 0;
    width: 128rpx;
    height: 128rpx;
    border-radius: 50%;
    background: $c-primary;
    color: #fff;
    text-align: center;
    line-height: 128rpx;
    font-size: 52rpx;
    font-weight: 700;
    box-shadow: 0 10rpx 24rpx rgba(185, 70, 47, 0.25);
    box-sizing: border-box;
    border: 6rpx solid #fff;
  }

  &__info {
    flex: 1;
    margin-left: $sp-md;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    color: $text-main;
    font-size: $fs-large;
    font-weight: 700;
    letter-spacing: 1rpx;
  }

  &__acc {
    margin-top: 10rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }

  &__action {
    flex-shrink: 0;
    margin-left: $sp-sm;
    padding: 14rpx 32rpx;
    font-size: $fs-caption;
    font-weight: 600;
    color: #fff;
    background: $c-primary;
    border-radius: $radius-pill;
    box-shadow: 0 8rpx 18rpx rgba(185, 70, 47, 0.22);
  }
}

/* ---------- 菜单 ---------- */
.menu {
  margin: -40rpx $sp-md 0;
  padding: $sp-xs $sp-md;

  & + & { margin-top: $sp-md; }
}

.menu__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  font-size: $fs-body;
  color: $text-main;
  border-bottom: 1rpx dashed $border-color;

  &:last-child { border-bottom: none; }
}

.menu__arrow {
  color: $text-light;
  font-size: 34rpx;
  line-height: 1;
}

.footer {
  text-align: center;
  color: $text-light;
  font-size: 22rpx;
  letter-spacing: 2rpx;
  padding: 48rpx 0 24rpx;
}
</style>