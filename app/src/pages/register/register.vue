<template>
  <view class="page">
    <view class="brand">
      <text class="brand__eyebrow">JOIN STARLIGHT</text>
      <text class="brand__title">注册账号</text>
      <view class="brand__line"></view>
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
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 80rpx $sp-lg 60rpx;
  background: linear-gradient(170deg, #F6EDE2 0%, $bg-color 40%);
}

/* ---------- 品牌区 ---------- */
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 52rpx;

  &__eyebrow {
    font-size: 20rpx;
    letter-spacing: 8rpx;
    color: $c-gold;
    font-weight: 600;
  }

  &__title {
    margin-top: 16rpx;
    font-size: $fs-hero - 4rpx;
    font-weight: 700;
    letter-spacing: 4rpx;
    color: $text-main;
  }

  &__line {
    width: 56rpx;
    height: 4rpx;
    margin: 20rpx 0 16rpx;
    border-radius: 4rpx;
    background: $c-gold;
  }

  &__sub {
    font-size: $fs-caption;
    color: $text-sub;
  }
}

/* ---------- 表单卡片 ---------- */
.form {
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-float;
  padding: $sp-lg;
}

.field {
  display: flex;
  align-items: center;
  margin-bottom: $sp-sm + 4rpx;
  padding: 0 $sp-md;
  height: 92rpx;
  background: $surface-2;
  border-radius: $radius-md;

  &__label {
    flex-shrink: 0;
    width: 140rpx;
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
  margin-top: $sp-lg;
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