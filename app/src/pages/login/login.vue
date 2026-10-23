<template>
  <view class="page">
    <view class="brand">
      <text class="brand__eyebrow">STARLIGHT CINEMA</text>
      <text class="brand__title">星辉影城</text>
      <view class="brand__line"></view>
      <text class="brand__sub">在线购票系统</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="field__label">账号</text>
        <input class="field__input" v-model="username" placeholder="请输入用户名" />
      </view>
      <view class="field">
        <text class="field__label">密码</text>
        <input class="field__input" v-model="password" :password="true" placeholder="请输入密码" />
      </view>

      <view class="submit" @tap="onLogin">登录</view>
      <view class="links">
        <text class="link" @tap="goRegister">没有账号？去注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { login } from '../../api/auth'
import { useUserStore } from '../../store/user'

const user = useUserStore()
const username = ref('')
const password = ref('')

function onLogin() {
  if (!username.value.trim()) return uni.showToast({ title: '请输入用户名', icon: 'none' })
  if (!password.value) return uni.showToast({ title: '请输入密码', icon: 'none' })
  login({ username: username.value.trim(), password: password.value }).then(d => {
    user.setLogin(d.token, d.user)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) uni.navigateBack()
      else uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  }).catch(() => {})
}

function goRegister() {
  uni.navigateTo({ url: '/pages/register/register' })
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 110rpx $sp-lg 60rpx;
  background: linear-gradient(170deg, #F6EDE2 0%, $bg-color 46%);
}

/* ---------- 品牌区 ---------- */
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 70rpx;

  &__eyebrow {
    font-size: 20rpx;
    letter-spacing: 8rpx;
    color: $c-gold;
    font-weight: 600;
  }

  &__title {
    margin-top: 18rpx;
    font-size: $fs-hero + 4rpx;
    font-weight: 700;
    letter-spacing: 6rpx;
    color: $text-main;
  }

  &__line {
    width: 56rpx;
    height: 4rpx;
    margin: 22rpx 0 18rpx;
    border-radius: 4rpx;
    background: $c-gold;
  }

  &__sub {
    font-size: $fs-caption;
    letter-spacing: 3rpx;
    color: $text-sub;
  }
}

/* ---------- 表单卡片 ---------- */
.form {
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-float;
  padding: $sp-xl $sp-lg;
}

.field {
  display: flex;
  align-items: center;
  margin-bottom: $sp-md;
  padding: 0 $sp-md;
  height: 96rpx;
  background: $surface-2;
  border-radius: $radius-md;
  border: 1rpx solid transparent;

  &__label {
    flex-shrink: 0;
    width: 110rpx;
    font-size: $fs-small;
    color: $text-sub;
  }

  &__input {
    flex: 1;
    font-size: $fs-body;
    color: $text-main;
  }
}

.submit {
  margin-top: $sp-xl;
  padding: 26rpx 0;
  text-align: center;
  font-size: $fs-title;
  font-weight: 600;
  letter-spacing: 4rpx;
  color: #fff;
  background: $c-primary;
  border-radius: $radius-pill;
  box-shadow: 0 12rpx 26rpx rgba(185, 70, 47, 0.24);
}

.links {
  margin-top: $sp-md;
  text-align: center;
}

.link {
  font-size: $fs-caption;
  color: $link-color;
}
</style>