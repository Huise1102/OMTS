<template>
  <view class="page">
    <!-- 品牌头部 -->
    <view class="topbar">
      <view class="topbar__brand">
        <text class="topbar__eyebrow">STARLIGHT CINEMA</text>
        <text class="topbar__slogan">光影之间，遇见好故事</text>
      </view>
      <view class="topbar__chat" @tap="goChat">智能助手</view>
    </view>

    <!-- 搜索框 -->
    <view class="search">
      <input
        class="search__input"
        v-model="searchKw"
        placeholder="搜索影片 / 导演 / 主演"
        placeholder-class="search__ph"
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
      indicator-color="rgba(255,255,255,0.35)"
      indicator-active-color="#E0A44A"
    >
      <swiper-item v-for="(b, i) in banners" :key="i" @tap="onBanner(b)">
        <view class="banner__item" :style="{ background: bannerBg(i) }">
          <view class="banner__inner">
            <text class="banner__label">正在热映</text>
            <text class="banner__title">{{ b.title }}</text>
            <view class="banner__line"></view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 影片类型 -->
    <view class="section">
      <view class="section-head">
        <text class="section-head__title">影片类型</text>
      </view>
      <scroll-view scroll-x class="cats" :show-scrollbar="false">
        <view v-for="c in categories" :key="c.id" class="chip cat" @tap="goCategory(c)">{{ c.name }}</view>
      </scroll-view>
    </view>

    <!-- 热映推荐 -->
    <view class="section">
      <view class="section-head">
        <text class="section-head__title">热映推荐</text>
        <text class="section-head__more" @tap="goList">查看全部</text>
      </view>
      <view class="grid">
        <view v-for="m in hot" :key="m.id" class="movie" @tap="goDetail(m)">
          <movie-poster :title="m.title" :sub="m.version" width="100%" height="480rpx" />
          <text class="movie__title">{{ m.title }}</text>
          <view class="movie__meta">
            <text class="movie__rating">{{ fmtRating(m.rating) }}<text class="movie__rating-unit">分</text></text>
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
  'linear-gradient(135deg, #A8402B, #5E1E14)',
  'linear-gradient(135deg, #8C6A3F, #4A3520)',
  'linear-gradient(135deg, #7A5C4A, #3A2A21)',
  'linear-gradient(135deg, #5C6B57, #2B3527)'
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
.page { padding-bottom: 48rpx; }

/* ---------- 头部 ---------- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx $sp-md 56rpx;
  background: linear-gradient(160deg, #F6EDE2 0%, #FAF7F2 70%);

  &__brand {
    display: flex;
    flex-direction: column;
  }

  &__eyebrow {
    font-size: 20rpx;
    letter-spacing: 4rpx;
    color: $c-gold;
    font-weight: 600;
  }

  &__slogan {
    margin-top: 10rpx;
    font-size: 38rpx;
    font-weight: 700;
    letter-spacing: 1rpx;
    color: $text-main;
  }

  &__chat {
    flex-shrink: 0;
    color: $c-primary;
    background: $c-primary-soft;
    border-radius: $radius-pill;
    padding: 12rpx 26rpx;
    font-size: $fs-caption;
    font-weight: 600;
  }
}

/* ---------- 搜索（上浮压住头部边缘） ---------- */
.search {
  display: flex;
  align-items: center;
  margin: -38rpx $sp-md 0;
  padding: 8rpx 8rpx 8rpx 28rpx;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-pill;
  box-shadow: $shadow-card;
  position: relative;
  z-index: 2;

  &__input {
    flex: 1;
    font-size: $fs-small;
    color: $text-main;
    height: 64rpx;
  }

  &__ph { color: $text-light; }

  &__btn {
    background: $c-primary;
    color: #fff;
    border-radius: $radius-pill;
    padding: 16rpx 34rpx;
    font-size: $fs-small;
    font-weight: 600;
  }
}

/* ---------- 轮播 ---------- */
.banner {
  height: 300rpx;
  margin: $sp-md;
  border-radius: $radius-lg;
  overflow: hidden;

  &__item {
    height: 100%;
    display: flex;
    align-items: flex-end;
    box-sizing: border-box;
    padding: 32rpx;
    color: #fff;
  }

  &__inner {
    display: flex;
    flex-direction: column;
  }

  &__label {
    align-self: flex-start;
    font-size: 20rpx;
    letter-spacing: 2rpx;
    padding: 6rpx 16rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.5);
    border-radius: $radius-pill;
    color: rgba(255, 255, 255, 0.92);
  }

  &__title {
    margin-top: 16rpx;
    font-size: 46rpx;
    font-weight: 700;
    letter-spacing: 2rpx;
  }

  &__line {
    width: 64rpx;
    height: 3rpx;
    margin-top: 16rpx;
    background: $c-gold;
  }
}

/* ---------- 区块 ---------- */
.section { margin-top: $sp-lg; }

.cats {
  white-space: nowrap;
  padding: 0 $sp-md;
}

.cat { margin-right: $sp-sm; }

/* ---------- 影片网格 ---------- */
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 $sp-md;
  justify-content: space-between;
}

.movie {
  width: 47.5%;
  margin-bottom: $sp-md;

  &__title {
    display: block;
    margin-top: 14rpx;
    font-size: $fs-body;
    font-weight: 600;
    color: $text-main;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6rpx;
  }

  &__rating {
    color: $c-gold;
    font-size: $fs-small;
    font-weight: 700;
  }

  &__rating-unit {
    font-size: 18rpx;
    font-weight: 400;
    color: $text-sub;
    margin-left: 2rpx;
  }

  &__tag {
    font-size: 20rpx;
    color: $c-primary;
    background: $c-primary-soft;
    border-radius: $radius-sm;
    padding: 2rpx 12rpx;
  }
}

/* ---------- 快捷入口 ---------- */
.entries {
  display: flex;
  padding: 0 $sp-md;
  margin-top: $sp-sm;
}

.entry {
  flex: 1;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $sp-md;
  box-shadow: $shadow-card;
  position: relative;
  overflow: hidden;

  &:first-child { margin-right: $sp-sm; }

  /* 左侧琥珀色装饰条 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 22rpx;
    bottom: 22rpx;
    width: 5rpx;
    border-radius: 0 6rpx 6rpx 0;
    background: $c-gold;
  }

  &__title {
    display: block;
    font-size: $fs-body;
    font-weight: 600;
    color: $text-main;
  }

  &__sub {
    display: block;
    margin-top: 8rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }
}
</style>
