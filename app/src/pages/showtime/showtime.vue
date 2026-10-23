<template>
  <view class="page">
    <!-- 影片头部 -->
    <view class="head">
      <movie-poster :title="movie ? movie.title : ''" :sub="movie ? movie.version : ''" :width="100" :height="140" />
      <view class="head__info">
        <text class="head__title">{{ movie ? movie.title : '选择场次' }}</text>
        <text class="head__sub" v-if="movie">{{ movie.version }} · {{ movie.duration }}分钟 · {{ fmtRating(movie.rating) }}分</text>
      </view>
    </view>

    <!-- 日期选择 -->
    <scroll-view scroll-x class="dates" :show-scrollbar="false">
      <view
        v-for="d in dates"
        :key="d.date"
        class="date"
        :class="{ active: d.date === curDate }"
        @tap="switchDate(d.date)"
      >
        <text class="date__label">{{ d.label }}</text>
        <text class="date__week">{{ d.week }}</text>
      </view>
    </scroll-view>

    <!-- 按影院分组的场次 -->
    <view v-for="(group, name) in grouped" :key="name" class="cinema">
      <view class="cinema__name">{{ name }}</view>
      <view v-for="s in group" :key="s.id" class="showtime">
        <view class="showtime__main">
          <text class="showtime__time">{{ fmtTime(s.show_time) }}</text>
          <text class="showtime__hall">{{ s.hall_name }} · {{ s.version }}</text>
        </view>
        <view class="showtime__price">
          <text class="showtime__price-num">¥{{ fmtPrice(s.price) }}</text>
          <text class="showtime__remain">余 {{ s.total_seat - s.sold_seat }} 座</text>
        </view>
        <view
          class="showtime__btn"
          :class="{ disabled: s.sold_seat >= s.total_seat }"
          @tap="select(s)"
        >{{ s.sold_seat >= s.total_seat ? '满场' : '选座' }}</view>
      </view>
    </view>

    <view v-if="loaded && !showtimes.length" class="empty">该日期暂无场次</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMovieDetail } from '../../api/movie'
import { getShowtimeList } from '../../api/showtime'
import { useBookingStore } from '../../store/booking'
import { fmtRating, fmtTime, fmtPrice, nextDates } from '../../utils/index'

const booking = useBookingStore()

const movie = ref(null)
const movieId = ref('')
const dates = nextDates(7)
const curDate = ref(dates[0].date)
const showtimes = ref([])
const loaded = ref(false)

const grouped = computed(() => {
  const map = {}
  ;(showtimes.value || []).forEach(s => {
    const key = s.cinema_name || '未知影院'
    ;(map[key] = map[key] || []).push(s)
  })
  return map
})

onLoad((options) => {
  movieId.value = (options && options.movieId) || ''
  if (!movieId.value) return uni.showToast({ title: '参数错误', icon: 'none' })
  getMovieDetail(movieId.value).then(d => {
    movie.value = d
    booking.setMovie(d)
  }).catch(() => {})
  // 直接用路由参数加载场次：此时 movie 详情尚未返回，不能依赖 movie.value
  loadShowtimes(true)
})

function loadShowtimes(autoAdvance = false) {
  if (!movieId.value) return
  getShowtimeList({ movieId: movieId.value, date: curDate.value })
    .then(d => {
      const list = d || []
      // 当前日期无场次时，自动向后寻找最近有场次的日期（仅首次进入时）
      if (autoAdvance && !list.length) {
        const idx = dates.findIndex(x => x.date === curDate.value)
        if (idx >= 0 && idx < dates.length - 1) {
          curDate.value = dates[idx + 1].date
          return loadShowtimes(true)
        }
      }
      showtimes.value = list
      loaded.value = true
    })
    .catch(() => { loaded.value = true })
}

function switchDate(date) {
  curDate.value = date
  loadShowtimes(false)
}

function select(s) {
  if (s.sold_seat >= s.total_seat) return
  booking.setShowtime(s)
  uni.navigateTo({ url: `/pages/seat/seat?showtimeId=${s.id}` })
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 40rpx; }

.head {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  margin-bottom: 20rpx;
  &__info { flex: 1; margin-left: 24rpx; }
  &__title { font-size: 34rpx; font-weight: 700; }
  &__sub { display: block; font-size: 24rpx; color: $text-sub; margin-top: 10rpx; }
}

.dates { white-space: nowrap; padding: 0 24rpx 20rpx; }
.date {
  display: inline-block;
  width: 120rpx;
  text-align: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx 0;
  margin-right: 16rpx;
  &__label { display: block; font-size: 26rpx; color: $text-main; }
  &__week { display: block; font-size: 22rpx; color: $text-sub; margin-top: 4rpx; }
  &.active {
    background: $brand-red;
    .date__label, .date__week { color: #fff; }
  }
}

.cinema { margin: 0 24rpx 20rpx; }
.cinema__name { font-size: 26rpx; color: $text-sub; padding: 8rpx 0; }
.showtime {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-top: 12rpx;
  &__main { flex: 1; display: flex; flex-direction: column; }
  &__time { font-size: 34rpx; font-weight: 700; }
  &__hall { font-size: 24rpx; color: $text-sub; margin-top: 6rpx; }
  &__price { display: flex; flex-direction: column; align-items: flex-end; margin-right: 24rpx; }
  &__price-num { color: $price-color; font-size: 32rpx; font-weight: 700; }
  &__remain { font-size: 22rpx; color: $text-sub; margin-top: 4rpx; }
  &__btn {
    background: $brand-red;
    color: #fff;
    border-radius: 32rpx;
    padding: 12rpx 30rpx;
    font-size: 26rpx;
    &.disabled { background: #ccc; }
  }
}

.empty { text-align: center; color: $text-sub; padding: 80rpx 0; }
</style>