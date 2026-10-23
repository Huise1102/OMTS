<template>
  <view class="page">
    <!-- 品牌头部 -->
    <view class="topbar">
      <view class="topbar__brand">
        <text class="topbar__title">星辉影城</text>
        <text class="topbar__slogan">光影之间，遇见好故事</text>
      </view>
      <view class="topbar__chat" @tap="goChat">
        <text>智能助手</text>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search">
      <input
        class="search__input"
        v-model="searchKw"
        placeholder="搜索影片 / 导演 / 主演"
        confirm-type="search"
        @confirm="goSearch"
      />
      <view class="search__btn" @tap="goSearch">搜索</view>
    </view>

    <!-- 轮播 Banner -->
    <swiper
      v-if="banners.length"
      class="banner"
      circular
      autoplay
      :interval="4000"
      indicator-dots
      indicator-color="rgba(255,255,255,0.4)"
      indicator-active-color="#ffffff"
    >
      <swiper-item v-for="(b, i) in banners" :key="i" @tap="onBanner(b)">
        <view class="banner__item" :style="{ background: bannerBg(i) }">
          <text class="banner__title">{{ b.title }}</text>
          <text class="banner__sub">热映推荐</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 影片类型 -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">影片类型</text>
      </view>
      <scroll-view scroll-x class="cats" :show-scrollbar="false">
        <view v-for="c in categories" :key="c.id" class="cat" @tap="goCategory(c)">{{ c.name }}</view>
      </scroll-view>
    </view>

    <!-- 热映推荐 -->
    <view class="section">
      <view class="section__head">
        <text class="section__title">热映推荐</text>
        <text class="section__more" @tap="goList">查看全部</text>
      </view>
      <view class="grid">
        <view v-for="m in hot" :key="m.id" class="movie" @tap="goDetail(m)">
          <movie-poster :title="m.title" :sub="m.version" />
          <text class="movie__title">{{ m.title }}</text>
          <view class="movie__meta">
            <text class="movie__rating">{{ fmtRating(m.rating) }}分</text>
            <text class="movie__tag">热映</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="entries">
      <view class="entry" @tap="goGuide">
        <text class="entry__title">观影指南</text>
        <text class="entry__sub">购票 · 取票 · 观影须知</text>
      </view>
      <view class="entry" @tap="goChat">
        <text class="entry__title">智能购票助手</text>
        <text class="entry__sub">一句话帮你订票 / 退票</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getBanner, getCategory, getHot } from '../../api/movie'
import { fmtRating } from '../../utils/index'
import { useFilterStore } from '../../store/filter'

const filter = useFilterStore()

const banners = ref([])
const categories = ref([])
const hot = ref([])
const searchKw = ref('')

const bannerPalettes = [
  'linear-gradient(135deg, #C8102E, #5A0712)',
  'linear-gradient(135deg, #2B4C7E, #101E33)',
  'linear-gradient(135deg, #C9A86A, #6B4E1F)',
  'linear-gradient(135deg, #4E9F6D, #16391F)'
]
const bannerBg = (i) => bannerPalettes[i % bannerPalettes.length]

function loadData() {
  getBanner().then(d => { banners.value = d || [] }).catch(() => {})
  getCategory().then(d => { categories.value = d || [] }).catch(() => {})
  getHot().then(d => { hot.value = d || [] }).catch(() => {})
}

onLoad(() => { loadData() })

function goList() { filter.goAll() }
function goDetail(m) { uni.navigateTo({ url: `/pages/movie/detail?id=${m.id}` }) }
function goCategory(c) { filter.goType(c.id) }
function goSearch() {
  const kw = searchKw.value.trim()
  if (kw) filter.goSearch(kw)
  else filter.goAll()
}
function goGuide() { uni.navigateTo({ url: '/pages/guide/guide' }) }
function goChat() { uni.navigateTo({ url: '/pages/chat/chat' }) }
function onBanner(b) {
  if (b && b.link_type === 'movie' && b.link_id) {
    uni.navigateTo({ url: `/pages/movie/detail?id=${b.link_id}` })
  }
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 40rpx; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: $brand-red;
  &__brand { display: flex; flex-direction: column; }
  &__title { color: #fff; font-size: 40rpx; font-weight: 700; }
  &__slogan { color: rgba(255,255,255,0.85); font-size: 22rpx; margin-top: 4rpx; }
  &__chat {
    color: #fff;
    border: 1rpx solid rgba(255,255,255,0.7);
    border-radius: 30rpx;
    padding: 10rpx 24rpx;
    font-size: 24rpx;
  }
}

.search {
  display: flex;
  align-items: center;
  margin: -16rpx 24rpx 0;
  background: #fff;
  border-radius: 40rpx;
  padding: 8rpx 8rpx 8rpx 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  position: relative;
  z-index: 2;
  &__input { flex: 1; font-size: 26rpx; }
  &__btn {
    color: #fff;
    background: $brand-red;
    border-radius: 32rpx;
    padding: 12rpx 28rpx;
    font-size: 24rpx;
  }
}

.banner {
  height: 300rpx;
  margin: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  &__item {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  &__title { font-size: 44rpx; font-weight: 700; }
  &__sub { margin-top: 12rpx; font-size: 26rpx; opacity: 0.9; }
}

.section { margin-top: 24rpx; }
.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  margin-bottom: 16rpx;
}
.section__title { font-size: 32rpx; font-weight: 700; }
.section__more { color: $text-sub; font-size: 24rpx; }

.cats { white-space: nowrap; padding: 0 24rpx; }
.cat {
  display: inline-block;
  background: #fff;
  border: 1rpx solid $border-color;
  border-radius: 30rpx;
  padding: 12rpx 30rpx;
  margin-right: 16rpx;
  font-size: 26rpx;
  color: $text-main;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 24rpx;
  justify-content: space-between;
}
.movie {
  width: 46%;
  margin-bottom: 24rpx;
  &__title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    margin-top: 12rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__meta { display: flex; align-items: center; justify-content: space-between; margin-top: 6rpx; }
  &__rating { color: $price-color; font-size: 24rpx; }
  &__tag { color: $brand-red; font-size: 22rpx; border: 1rpx solid $brand-red; border-radius: 6rpx; padding: 0 8rpx; }
}

.entries {
  display: flex;
  padding: 0 24rpx;
  margin-top: 8rpx;
}
.entry {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  &:first-child { margin-right: 20rpx; }
  &__title { display: block; font-size: 28rpx; font-weight: 600; color: $text-main; }
  &__sub { display: block; font-size: 22rpx; color: $text-sub; margin-top: 8rpx; }
}
</style>