<template>
  <view class="page">
    <!-- 影片头部 -->
    <view class="head">
      <movie-poster :title="movie ? movie.title : ''" :sub="movie ? movie.version : ''" :width="130" :height="182" />
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
      let list = d || []
      // 今天已开场的场次不再展示（模拟真实售票）
      if (curDate.value === dates[0].date) {
        const now = new Date()
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        list = list.filter(s => s.show_time.slice(0, 5) > hhmm)
      }
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
.page { padding-bottom: 48rpx; }

/* ---------- 影片头部 ---------- */
.head {
  display: flex;
  align-items: center;
  padding: $sp-md;
  background: linear-gradient(160deg, #F6EDE2 0%, #FAF7F2 100%);

  &__info {
    flex: 1;
    margin-left: $sp-md;
    min-width: 0;
  }

  &__title {
    font-size: $fs-title;
    font-weight: 700;
    color: $text-main;
  }

  &__sub {
    display: block;
    margin-top: 10rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }
}

/* ---------- 日期选择 ---------- */
.dates {
  white-space: nowrap;
  padding: $sp-sm $sp-md $sp-md;
}

.date {
  display: inline-block;
  width: 118rpx;
  text-align: center;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: 16rpx 0;
  margin-right: $sp-sm;

  &__label {
    display: block;
    font-size: $fs-small;
    color: $text-main;
  }

  &__week {
    display: block;
    margin-top: 4rpx;
    font-size: 20rpx;
    color: $text-light;
  }

  &.active {
    background: $c-primary;
    border-color: $c-primary;

    .date__label { color: #fff; font-weight: 600; }
    .date__week { color: rgba(255, 255, 255, 0.8); }
  }
}

/* ---------- 影院分组 ---------- */
.cinema { margin: 0 $sp-md $sp-md; }

.cinema__name {
  display: flex;
  align-items: center;
  font-size: $fs-small;
  color: $text-sub;
  padding: $sp-xs 0 $sp-xs;

  &::before {
    content: '';
    width: 6rpx;
    height: 24rpx;
    margin-right: 12rpx;
    border-radius: 6rpx;
    background: $c-gold;
  }
}

/* ---------- 场次卡片 ---------- */
.showtime {
  display: flex;
  align-items: center;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $sp-md;
  margin-top: $sp-sm;
  box-shadow: $shadow-card;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__time {
    font-size: 38rpx;
    font-weight: 700;
    color: $text-main;
    letter-spacing: 1rpx;
  }

  &__hall {
    margin-top: 6rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }

  &__price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: $sp-md;
  }

  &__price-num {
    color: $price-color;
    font-size: $fs-title;
    font-weight: 700;
  }

  &__remain {
    margin-top: 4rpx;
    font-size: 20rpx;
    color: $text-light;
  }

  &__btn {
    background: $c-primary;
    color: #fff;
    border-radius: $radius-pill;
    padding: 14rpx 30rpx;
    font-size: $fs-caption;
    font-weight: 600;

    &.disabled {
      background: $surface-2;
      color: $text-light;
    }
  }
}
</style>