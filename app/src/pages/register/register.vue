<template>
  <view class="page">
    <view class="brand">
      <text class="brand__title">注册账号</text>
      <text class="brand__sub">加入星辉影城，开启观影之旅</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="field__label">账号</text>
        <input class="field__input" v-model="username" placeholder="请输入用户名" />
      </view>
      <view class="field">
        <text class="field__label">昵称</text>
        <input class="field__input" v-model="nickname" placeholder="请输入昵称（可选）" />
      </view>
      <view class="field">
        <text class="field__label">手机号</text>
        <input class="field__input" v-model="phone" type="number" placeholder="请输入手机号（可选）" />
      </view>
      <view class="field">
        <text class="field__label">密码</text>
        <input class="field__input" v-model="password" :password="true" placeholder="请输入密码" />
      </view>
      <view class="field">
        <text class="field__label">确认密码</text>
        <input class="field__input" v-model="confirm" :password="true" placeholder="请再次输入密码" />
      </view>

      <view class="submit" @tap="onRegister">注册</view>
      <view class="links">
        <text class="link" @tap="goLogin">已有账号？去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { register } from '../../api/auth'

const username = ref('')
const nickname = ref('')
const phone = ref('')
const password = ref('')
const confirm = ref('')

function onRegister() {
  if (!username.value.trim()) return uni.showToast({ title: '请输入用户名', icon: 'none' })
  if (!password.value) return uni.showToast({ title: '请输入密码', icon: 'none' })
  if (password.value !== confirm.value) return uni.showToast({ title: '两次密码不一致', icon: 'none' })

  register({
    username: username.value.trim(),
    password: password.value,
    nickname: nickname.value.trim(),
    phone: phone.value.trim()
  }).then(() => {
    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/login/login' })
    }, 600)
  }).catch(() => {})
}

function goLogin() {
  uni.redirectTo({ url: '/pages/login/login' })
}
</script>

<style scoped lang="scss">
.page { padding: 60rpx 48rpx; }

.brand { display: flex; flex-direction: column; align-items: center; margin-bottom: 60rpx; }
.brand__title { font-size: 48rpx; font-weight: 700; color: $brand-red; }
.brand__sub { font-size: 24rpx; color: $text-sub; margin-top: 12rpx; }

.form { background: #fff; border-radius: 20rpx; padding: 40rpx 32rpx; }
.field { display: flex; align-items: center; border-bottom: 1rpx solid $border-color; padding: 24rpx 0; }
.field__label { width: 140rpx; font-size: 28rpx; color: $text-main; }
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