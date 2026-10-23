<template>
  <view class="page">
    <view class="brand">
      <text class="brand__title">星辉影城</text>
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
.page { padding: 80rpx 48rpx; }

.brand { display: flex; flex-direction: column; align-items: center; margin-bottom: 80rpx; }
.brand__title { font-size: 56rpx; font-weight: 700; color: $brand-red; }
.brand__sub { font-size: 26rpx; color: $text-sub; margin-top: 12rpx; }

.form { background: #fff; border-radius: 20rpx; padding: 40rpx 32rpx; }
.field { display: flex; align-items: center; border-bottom: 1rpx solid $border-color; padding: 24rpx 0; }
.field__label { width: 120rpx; font-size: 28rpx; color: $text-main; }
.field__input { flex: 1; font-size: 28rpx; }

.submit {
  background: $brand-red;
  color: #fff;
  text-align: center;
  border-radius: 44rpx;
  padding: 24rpx 0;
  font-size: 32rpx;
  margin-top: 48rpx;
}
.links { margin-top: 28rpx; text-align: center; }
.link { color: $link-color; font-size: 26rpx; }
</style>