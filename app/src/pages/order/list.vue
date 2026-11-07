<template>
  <view class="page">
    <!-- 状态筛选 -->
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ active: cur === t.value }"
        @tap="switchTab(t.value)"
      >{{ t.label }}</view>
    </scroll-view>

    <!-- 清除历史订单 -->
    <view class="toolbar">
      <view class="toolbar__btn" @tap="onClear">清除历史订单</view>
    </view>

    <!-- 订单列表 -->
    <view v-if="loading" class="order-list">
      <view v-for="i in 3" :key="i" class="order order--skeleton">
        <skeleton-block width="45%" height="34rpx" />
        <view class="order__skeleton-line"><skeleton-block width="65%" height="24rpx" /></view>
        <view class="order__skeleton-line"><skeleton-block width="55%" height="24rpx" /></view>
        <view class="order__skeleton-line"><skeleton-block width="30%" height="36rpx" /></view>
      </view>
    </view>
    <view v-else class="order-list">
      <view v-for="o in orders" :key="o.id" class="order" @tap="goDetail(o)">
        <view class="order__top">
          <text class="order__movie">{{ o.movie_title }}</text>
          <text class="order__status" :style="{ color: orderStatusColor(o.status) }">{{ orderStatus(o.status) }}</text>
        </view>
        <text class="order__meta">{{ o.cinema_name }} · {{ o.hall_name }}</text>
        <text class="order__meta">{{ o.show_date }} {{ fmtTime(o.show_time) }}（{{ o.ticket_qty }}张）</text>
        <text v-if="o.status === 0" class="order__countdown">{{ remainText(o) }}</text>
        <view class="order__cut"></view>
        <view class="order__bottom">
          <text class="order__amount">¥{{ fmtPrice(o.total_amount) }}</text>
          <view class="order__actions">
            <view v-if="o.status === 0" class="act act--plain" :class="{ busy: actingId === o.id }" @tap.stop="onCancel(o)">取消</view>
            <view v-if="o.status === 0" class="act act--primary" :class="{ busy: actingId === o.id }" @tap.stop="onPay(o)">去支付</view>
            <view v-if="o.status === 1 || o.status === 2" class="act act--plain" :class="{ busy: actingId === o.id }" @tap.stop="onRefund(o)">退票</view>
          </view>
        </view>
      </view>
    </view>

    <empty-state
      v-if="loaded && !orders.length"
      title="暂无订单"
      desc="选一部喜欢的影片，开启观影之旅"
      action-text="去逛逛"
      @action="goHome"
    />

    <view v-if="loaded && orders.length" class="list-more">
      {{ loadingMore ? '加载中…' : (hasMore ? '' : '没有更多了') }}
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onHide, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getOrderList, payOrder, cancelOrder, refundOrder, clearOrders } from '../../api/order'
import { useUserStore } from '../../store/user'
import { orderStatus, orderStatusColor, fmtTime, fmtPrice, parseDateTime, fmtCountdown } from '../../utils/index'

const user = useUserStore()

const tabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已退票', value: 3 },
  { label: '已取消', value: 4 }
]

const cur = ref('')
const orders = ref([])
const loaded = ref(false)
const loading = ref(true)
const nowTick = ref(Date.now())
const actingId = ref(null)
const pageSize = 10
const page = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)
let timer = null

onShow(() => {
  startTimer()
  loadList()
})
onHide(() => { stopTimer() })
onUnload(() => { stopTimer() })
onPullDownRefresh(() => { loadList().finally(() => uni.stopPullDownRefresh()) })
onReachBottom(() => {
  if (!hasMore.value || loadingMore.value) return
  page.value += 1
  loadList(false)
})

// 页面统一一个秒级定时器，供待支付订单倒计时复用
function startTimer() {
  stopTimer()
  nowTick.value = Date.now()
  timer = setInterval(() => { nowTick.value = Date.now() }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function remainText(o) {
  const end = parseDateTime(o.expire_at)
  if (!end) return ''
  const diff = end.getTime() - nowTick.value
  return diff > 0 ? `剩余 ${fmtCountdown(diff)}` : '已超时'
}

function loadList(reset = true) {
  if (!user.isLogin) {
    orders.value = []
    loaded.value = true
    loading.value = false
    loadingMore.value = false
    return Promise.resolve()
  }
  if (!reset) {
    if (loadingMore.value || !hasMore.value || loading.value) return Promise.resolve()
    loadingMore.value = true
  } else {
    page.value = 1
    hasMore.value = true
    loading.value = true
  }
  const params = { page: page.value, pageSize }
  if (cur.value !== '') params.status = cur.value
  return getOrderList(params).then(d => {
    const list = d || []
    orders.value = reset ? list : orders.value.concat(list)
    hasMore.value = list.length === pageSize
  }).catch(() => {}).finally(() => {
    loaded.value = true
    loading.value = false
    loadingMore.value = false
  })
}

function switchTab(v) {
  cur.value = v
  loadList()
}

function goDetail(o) {
  uni.navigateTo({ url: `/pages/order/detail?id=${o.id}` })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

function onPay(o) {
  if (actingId.value) return
  actingId.value = o.id
  payOrder(o.id).then(() => {
    uni.showToast({ title: '支付成功', icon: 'success' })
    loadList()
  }).catch(() => {}).finally(() => { actingId.value = null })
}

function onCancel(o) {
  if (actingId.value) return
  uni.showModal({
    title: '提示',
    content: '确定取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        actingId.value = o.id
        cancelOrder(o.id).then(() => {
          uni.showToast({ title: '已取消', icon: 'none' })
          loadList()
        }).catch(() => {}).finally(() => { actingId.value = null })
      }
    }
  })
}

function onRefund(o) {
  if (actingId.value) return
  uni.showModal({
    title: '提示',
    content: '确定退票吗？退款将原路返回。',
    success: (res) => {
      if (res.confirm) {
        actingId.value = o.id
        refundOrder(o.id).then(() => {
          uni.showToast({ title: '退票成功', icon: 'success' })
          loadList()
        }).catch(() => {}).finally(() => { actingId.value = null })
      }
    }
  })
}

function onClear() {
  if (!user.isLogin) return uni.showToast({ title: '请先登录', icon: 'none' })
  uni.showModal({
    title: '清除历史订单',
    content: '将删除「已完成 / 已退票 / 已取消」的订单，删除后不可恢复。待支付与已支付订单会保留。',
    confirmText: '清除',
    confirmColor: '#B9462F',
    success: (res) => {
      if (!res.confirm) return
      clearOrders().then(d => {
        uni.showToast({ title: `已清除 ${(d && d.count) || 0} 条`, icon: 'none' })
        loadList()
      }).catch(() => {})
    }
  })
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 48rpx; }

/* ---------- 状态筛选 ---------- */
.tabs {
  white-space: nowrap;
  padding: $sp-md $sp-md 0;
}

.tab {
  display: inline-block;
  padding: 10rpx 26rpx;
  margin-right: $sp-xs;
  font-size: $fs-caption;
  color: $text-sub;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-pill;

  &.active {
    background: $c-primary;
    border-color: $c-primary;
    color: #fff;
    font-weight: 600;
  }
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 4rpx $sp-md 0;
}

.toolbar__btn {
  font-size: $fs-caption;
  color: $text-light;
  padding: 10rpx 0;

  &:active { opacity: 0.6; }
}

/* ---------- 订单卡片（票根） ---------- */
.order-list { padding-bottom: $sp-md; }

.order {
  position: relative;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-lg;
  margin: $sp-md $sp-md 0;
  padding: $sp-md;
  box-shadow: $shadow-card;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__movie {
    font-size: $fs-title;
    font-weight: 700;
    color: $text-main;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status {
    flex-shrink: 0;
    margin-left: $sp-sm;
    font-size: $fs-caption;
    font-weight: 600;
  }

  &__meta {
    display: block;
    margin-top: 8rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }

  &__countdown {
    display: block;
    margin-top: 6rpx;
    font-size: $fs-caption;
    color: $warning-color;
    font-weight: 600;
  }

  /* 票根撕线：虚线 + 两侧半圆缺口 */
  &__cut {
    position: relative;
    height: 0;
    margin: $sp-md -#{$sp-md};
    border-top: 2rpx dashed $border-color;

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: -14rpx;
      width: 28rpx;
      height: 28rpx;
      border-radius: 50%;
      background: $bg-color;
    }

    &::before { left: -14rpx; }
    &::after { right: -14rpx; }
  }

  &__bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__amount {
    color: $price-color;
    font-size: 36rpx;
    font-weight: 700;
  }

  &__actions { display: flex; }

  &__skeleton-line {
    margin-top: 14rpx;
  }
}

.act {
  padding: 10rpx 28rpx;
  border-radius: $radius-pill;
  font-size: $fs-caption;
  margin-left: $sp-sm;

  &--primary {
    background: $c-primary;
    color: #fff;
    font-weight: 600;
  }

  &--plain {
    color: $c-primary;
    border: 1rpx solid $c-primary;
  }

  &.busy {
    opacity: 0.55;
  }
}

.list-more {
  text-align: center;
  font-size: $fs-caption;
  color: $text-light;
  padding: $sp-lg 0;
}
</style>