<template>
  <view class="page">
    <!-- 收藏网格 -->
    <view v-if="loading" class="grid">
      <view v-for="i in 4" :key="i" class="movie">
        <skeleton-block width="100%" height="480rpx" :radius="20" />
        <view class="movie__skeleton-line"><skeleton-block width="60%" height="30rpx" /></view>
        <view class="movie__skeleton-line"><skeleton-block width="40%" height="24rpx" /></view>
      </view>
    </view>

    <view v-else-if="list.length" class="grid">
      <view v-for="m in list" :key="m.movieId" class="movie">
        <view @tap="goDetail(m)">
          <movie-poster :title="m.title" :sub="m.version" width="100%" height="480rpx" />
          <text class="movie__title">{{ m.title }}</text>
        </view>
        <view class="movie__meta">
          <text class="movie__rating">{{ fmtRating(m.rating) }}<text class="movie__rating-unit">分</text></text>
          <text class="movie__remove" @tap.stop="onRemove(m)">移除</text>
        </view>
      </view>
    </view>

    <empty-state
      v-else-if="!loading"
      title="还没有想看的电影"
      desc="去首页发现好故事"
      action-text="去逛逛"
      @action="goHome"
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFavorites, removeFavorite } from '../../api/movie'
import { useUserStore } from '../../store/user'
import { fmtRating } from '../../utils/index'

const user = useUserStore()
const list = ref([])
const loading = ref(true)

onShow(() => {
  loadList()
})

function loadList() {
  if (!user.isLogin) {
    loading.value = false
    uni.navigateTo({ url: '/pages/login/login' })
    return Promise.resolve()
  }
  loading.value = true
  return getFavorites().then(d => {
    list.value = d || []
  }).catch(() => {}).finally(() => {
    loading.value = false
  })
}

function goDetail(m) {
  uni.navigateTo({ url: `/pages/movie/detail?id=${m.movieId}` })
}

function onRemove(m) {
  uni.showModal({
    title: '移除收藏',
    content: `确定不再想看《${m.title}》吗？`,
    confirmText: '移除',
    confirmColor: '#B9462F',
    success: res => {
      if (!res.confirm) return
      removeFavorite(m.movieId).then(() => {
        list.value = list.value.filter(x => x.movieId !== m.movieId)
        uni.showToast({ title: '已移除', icon: 'none' })
      }).catch(() => {})
    }
  })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 48rpx; }

.grid {
  display: flex;
  flex-wrap: wrap;
  padding: $sp-md $sp-md 0;
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

  &__remove {
    font-size: $fs-caption;
    color: $text-sub;
    padding: 4rpx 8rpx;

    &:active { opacity: 0.6; }
  }

  &__skeleton-line {
    margin-top: 14rpx;
  }
}
</style>
