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
.page { padding-bottom: 170rpx; }

/* ---------- 海报区 ---------- */
.hero {
  display: flex;
  padding: 40rpx $sp-md 36rpx;
  background: linear-gradient(165deg, #F6EDE2 0%, #FAF7F2 100%);

  &__info {
    flex: 1;
    margin-left: 32rpx;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    color: $text-main;
    font-size: $fs-large;
    font-weight: 700;
    line-height: 1.3;
  }

  &__rating {
    display: flex;
    align-items: baseline;
    margin-top: 14rpx;
  }

  &__score {
    color: $c-gold;
    font-size: 56rpx;
    font-weight: 700;
    line-height: 1;
  }

  &__score-sub {
    color: $c-gold;
    font-size: $fs-caption;
    margin-left: 4rpx;
  }

  &__meta {
    margin-top: 16rpx;
    font-size: $fs-caption;
    color: $text-sub;
    line-height: 1.6;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    margin-top: 20rpx;
  }
}

.tag {
  color: $c-primary;
  background: $c-primary-soft;
  border-radius: $radius-sm;
  padding: 4rpx 16rpx;
  font-size: 20rpx;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
}

/* ---------- 信息行 ---------- */
.row {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx dashed $border-color;

  &:last-child { border-bottom: none; }
}

.row__label {
  width: 150rpx;
  color: $text-sub;
  font-size: $fs-small;
}

.row__val {
  flex: 1;
  font-size: $fs-small;
  color: $text-main;
  line-height: 1.6;
}

/* ---------- 简介 ---------- */
.card__title {
  display: flex;
  align-items: center;
  font-size: $fs-title;
  font-weight: 700;
  margin-bottom: $sp-sm;

  &::before {
    content: '';
    width: 6rpx;
    height: 28rpx;
    margin-right: 14rpx;
    border-radius: 6rpx;
    background: $c-gold;
  }
}

.desc {
  font-size: $fs-small;
  color: $text-sub;
  line-height: 1.8;
}

/* ---------- 底部购票 ---------- */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx $sp-md calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid $border-color;

  &__btn {
    background: $c-primary;
    color: #fff;
    text-align: center;
    border-radius: $radius-pill;
    padding: 26rpx 0;
    font-size: $fs-title;
    font-weight: 600;

    &:active { background: $c-primary-dark; }
  }
}
</style>