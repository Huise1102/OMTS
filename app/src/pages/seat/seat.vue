<template>
  <view class="page">
    <!-- 场次信息 -->
    <view class="head">
      <text class="head__title">{{ movieTitle }}</text>
      <text class="head__sub">{{ showInfo }}</text>
    </view>

    <!-- 银幕 -->
    <view class="screen">
      <view class="screen__bar">银幕</view>
    </view>

    <!-- 座位图 -->
    <view class="seat-map" v-if="hall">
      <view v-for="r in rows" :key="r.row" class="seat-row">
        <text class="seat-row__label">{{ r.row }}</text>
        <view v-for="(s, idx) in r.cols" :key="idx" class="seat-cell">
          <view v-if="s" class="seat" :class="seatClass(s)" @tap="toggle(s)"></view>
          <view v-else class="seat-space"></view>
        </view>
        <text class="seat-row__label">{{ r.row }}</text>
      </view>
    </view>

    <!-- 图例 -->
    <view class="legend">
      <view class="legend__item"><view class="dot dot--avail"></view><text>可选</text></view>
      <view class="legend__item"><view class="dot dot--sold"></view><text>已售</text></view>
      <view class="legend__item"><view class="dot dot--select"></view><text>已选</text></view>
      <view class="legend__item"><view class="dot dot--couple"></view><text>情侣座</text></view>
    </view>

    <!-- 底部结算 -->
    <view class="footer">
      <view class="footer__info">
        <text class="footer__count">已选 {{ selected.length }} 座 · {{ selectedLabel }}</text>
        <text class="footer__total">合计 <text class="footer__amount">¥{{ totalPrice }}</text></text>
      </view>
      <view class="footer__btn" :class="{ disabled: !selected.length }" @tap="submit">确认选座</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSeatMap, getShowtimeDetail } from '../../api/showtime'
import { createOrder } from '../../api/order'
import { useBookingStore } from '../../store/booking'
import { useUserStore } from '../../store/user'
import { fmtTime } from '../../utils/index'

const booking = useBookingStore()
const user = useUserStore()

const showtimeId = ref('')
const hall = ref(null)
const seats = ref([])
const detail = ref(null) // 场次详情，刷新或直达时也能拿到票价与影片信息
const selected = ref([]) // [{ id, seat_row, seat_col, seat_type }]

const showtime = computed(() => detail.value || booking.showtime)
const movieTitle = computed(() => {
  if (detail.value) return detail.value.movie_title
  return booking.movie ? booking.movie.title : ''
})
const showInfo = computed(() => {
  const s = showtime.value
  return s ? `${s.show_date} ${fmtTime(s.show_time)} · ${s.hall_name} · ${s.version}` : ''
})

const selectedIds = computed(() => new Set(selected.value.map(s => s.id)))

const rows = computed(() => {
  if (!hall.value) return []
  const map = {}
  seats.value.forEach(s => { map[s.seat_row + '-' + s.seat_col] = s })
  const arr = []
  for (let r = 1; r <= hall.value.rows; r++) {
    const cols = []
    for (let c = 1; c <= hall.value.cols; c++) {
      cols.push(map[r + '-' + c] || null)
    }
    arr.push({ row: r, cols })
  }
  return arr
})

const totalPrice = computed(() => {
  const p = showtime.value ? Number(showtime.value.price) : 0
  return (p * selected.value.length).toFixed(2)
})

const selectedLabel = computed(() => {
  return selected.value
    .slice()
    .sort((a, b) => a.seat_row - b.seat_row || a.seat_col - b.seat_col)
    .map(s => `${s.seat_row}排${s.seat_col}座`)
    .join(' ')
})

onLoad((options) => {
  showtimeId.value = options && options.showtimeId
  if (!showtimeId.value) return uni.showToast({ title: '参数错误', icon: 'none' })
  getShowtimeDetail(showtimeId.value).then(d => { detail.value = d }).catch(() => {})
  getSeatMap(showtimeId.value).then(d => {
    hall.value = d.hall
    seats.value = d.seats || []
  }).catch(() => {})
})

function seatClass(s) {
  if (s.status === 0) return 'seat--disabled'
  if (s.sold) return 'seat--sold'
  if (selectedIds.value.has(s.id)) return 'seat--selected'
  if (s.seat_type === '情侣') return 'seat--couple'
  return 'seat--avail'
}

function toggle(s) {
  if (s.status === 0 || s.sold) return
  const idx = selected.value.findIndex(x => x.id === s.id)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else {
    if (selected.value.length >= 6) {
      return uni.showToast({ title: '最多可选 6 个座位', icon: 'none' })
    }
    selected.value.push(s)
  }
}

function submit() {
  if (!selected.value.length) return
  if (!user.isLogin) {
    return setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 300)
  }
  const seatIds = selected.value.map(s => s.id)
  createOrder({ showtimeId: showtimeId.value, seatIds }).then(d => {
    uni.showToast({ title: '下单成功，请支付', icon: 'none' })
    booking.setSelectedSeats(selected.value.slice())
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/order/detail?id=${d.orderId}` })
    }, 500)
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 210rpx; }

/* ---------- 场次信息 ---------- */
.head {
  background: linear-gradient(160deg, #F6EDE2 0%, #FAF7F2 100%);
  padding: $sp-md;
  display: flex;
  flex-direction: column;

  &__title {
    font-size: $fs-title;
    font-weight: 700;
    color: $text-main;
  }

  &__sub {
    margin-top: 8rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }
}

/* ---------- 银幕 ---------- */
.screen {
  display: flex;
  justify-content: center;
  padding: 32rpx 0 12rpx;

  &__bar {
    width: 62%;
    height: 42rpx;
    background: linear-gradient(180deg, #E8DDD0, #F5EFE7);
    border-radius: 0 0 42rpx 42rpx;
    border-bottom: 3rpx solid $c-gold;
    text-align: center;
    line-height: 42rpx;
    font-size: 20rpx;
    color: $text-sub;
    letter-spacing: 8rpx;
  }
}

/* ---------- 座位图 ---------- */
.seat-map {
  padding: $sp-sm $sp-md;
  overflow-x: auto;
}

.seat-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.seat-row__label {
  width: 44rpx;
  text-align: center;
  font-size: 20rpx;
  color: $text-light;
  flex-shrink: 0;
}

.seat-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.seat {
  width: 44rpx;
  height: 44rpx;
  margin: 4rpx;
  border-radius: 10rpx 10rpx 14rpx 14rpx;
  box-sizing: border-box;

  &--avail {
    background: $card-bg;
    border: 2rpx solid #DCCFBE;
  }

  &--sold {
    background: $surface-2;
    border: 2rpx solid #E4D8C9;
  }

  &--selected {
    background: $c-primary;
    border: 2rpx solid $c-primary;
    box-shadow: 0 4rpx 10rpx rgba(185, 70, 47, 0.28);
  }

  &--couple {
    background: $c-gold-soft;
    border: 2rpx solid $c-gold;
  }

  &--disabled {
    background: transparent;
    border: 2rpx dashed #D8CCBD;
  }
}

.seat-space {
  width: 44rpx;
  height: 44rpx;
  margin: 4rpx;
}

/* ---------- 图例 ---------- */
.legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: $sp-sm 0;

  &__item {
    display: flex;
    align-items: center;
    margin: 6rpx $sp-sm;
    font-size: 20rpx;
    color: $text-sub;
  }
}

.dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 6rpx 6rpx 8rpx 8rpx;
  margin-right: 8rpx;

  &--avail { background: $card-bg; border: 2rpx solid #DCCFBE; }
  &--sold { background: $surface-2; border: 2rpx solid #E4D8C9; }
  &--select { background: $c-primary; }
  &--couple { background: $c-gold-soft; border: 2rpx solid $c-gold; }
}

/* ---------- 底部结算 ---------- */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx $sp-md calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.97);
  border-top: 1rpx solid $border-color;

  &__info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    padding-right: $sp-sm;
  }

  &__count {
    font-size: 20rpx;
    color: $text-sub;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__total {
    margin-top: 4rpx;
    font-size: $fs-small;
    color: $text-sub;
  }

  &__amount {
    color: $price-color;
    font-size: 38rpx;
    font-weight: 700;
  }

  &__btn {
    flex-shrink: 0;
    background: $c-primary;
    color: #fff;
    border-radius: $radius-pill;
    padding: 22rpx 52rpx;
    font-size: $fs-body;
    font-weight: 600;

    &.disabled {
      background: $surface-2;
      color: $text-light;
    }
  }
}
</style>