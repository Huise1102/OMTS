<template>
  <view class="page" v-if="movie">
    <!-- 海报区 -->
    <view class="hero">
      <movie-poster :title="movie.title" :sub="movie.version" :width="200" :height="280" />
      <view class="hero__info">
        <text class="hero__title">{{ movie.title }}</text>
        <view class="hero__rating">
          <text class="hero__score">{{ fmtRating(movie.rating) }}</text>
          <text class="hero__score-sub">分</text>
        </view>
        <text class="hero__meta">{{ movie.language }} · {{ movie.version }} · {{ movie.duration }}分钟</text>
        <view class="hero__tags">
          <text v-for="c in movie.categories" :key="c" class="tag">{{ c }}</text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="card">
      <view class="row"><text class="row__label">导演</text><text class="row__val">{{ movie.director || '未知' }}</text></view>
      <view class="row"><text class="row__label">主演</text><text class="row__val">{{ movie.actors || '暂无' }}</text></view>
      <view class="row"><text class="row__label">上映时间</text><text class="row__val">{{ movie.release_date }}</text></view>
      <view class="row"><text class="row__label">累计票房</text><text class="row__val">{{ movie.box_office }} 万</text></view>
    </view>

    <!-- 剧情简介 -->
    <view class="card">
      <view class="card__title">剧情简介</view>
      <text class="desc">{{ movie.description || '暂无简介' }}</text>
    </view>

    <!-- 底部购票 -->
    <view class="footer">
      <view class="footer__btn" @tap="goBuy">
        {{ movie.status === 1 ? '立即购票' : '预售选座' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMovieDetail } from '../../api/movie'
import { useBookingStore } from '../../store/booking'
import { fmtRating } from '../../utils/index'

const booking = useBookingStore()
const movie = ref(null)

onLoad((options) => {
  const id = options && options.id
  if (!id) return uni.showToast({ title: '参数错误', icon: 'none' })
  getMovieDetail(id).then(d => { movie.value = d }).catch(() => {})
})

function goBuy() {
  if (!movie.value) return
  booking.setMovie(movie.value)
  uni.navigateTo({ url: `/pages/showtime/showtime?movieId=${movie.value.id}` })
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 160rpx; }

.hero {
  display: flex;
  padding: 32rpx 24rpx;
  background: $brand-dark;
  &__info { flex: 1; margin-left: 32rpx; display: flex; flex-direction: column; }
  &__title { color: #fff; font-size: 40rpx; font-weight: 700; }
  &__rating { display: flex; align-items: baseline; margin-top: 12rpx; }
  &__score { color: $brand-gold; font-size: 52rpx; font-weight: 700; }
  &__score-sub { color: $brand-gold; font-size: 24rpx; }
  &__meta { color: rgba(255,255,255,0.8); font-size: 24rpx; margin-top: 8rpx; }
  &__tags { display: flex; flex-wrap: wrap; margin-top: 20rpx; }
}
.tag {
  color: $brand-gold;
  border: 1rpx solid $brand-gold;
  border-radius: 8rpx;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
}

.row { display: flex; padding: 14rpx 0; border-bottom: 1rpx solid $border-color; &:last-child { border-bottom: none; } }
.row__label { width: 140rpx; color: $text-sub; font-size: 26rpx; }
.row__val { flex: 1; font-size: 26rpx; }

.card__title { font-size: 30rpx; font-weight: 600; margin-bottom: 16rpx; }
.desc { font-size: 26rpx; color: $text-main; line-height: 1.7; }

.footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  &__btn {
    background: $brand-red;
    color: #fff;
    text-align: center;
    border-radius: 44rpx;
    padding: 24rpx 0;
    font-size: 32rpx;
  }
}
</style>