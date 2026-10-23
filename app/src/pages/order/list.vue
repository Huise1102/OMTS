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
    <view v-for="o in orders" :key="o.id" class="order" @tap="goDetail(o)">
      <view class="order__top">
        <text class="order__movie">{{ o.movie_title }}</text>
        <text class="order__status" :style="{ color: orderStatusColor(o.status) }">{{ orderStatus(o.status) }}</text>
      </view>
      <text class="order__meta">{{ o.cinema_name }} · {{ o.hall_name }}</text>
      <text class="order__meta">{{ o.show_date }} {{ fmtTime(o.show_time) }}（{{ o.ticket_qty }}张）</text>
      <view class="order__bottom">
        <text class="order__amount">¥{{ fmtPrice(o.total_amount) }}</text>
        <view class="order__actions">
          <view v-if="o.status === 0" class="act act--plain" @tap.stop="onCancel(o)">取消</view>
          <view v-if="o.status === 0" class="act act--primary" @tap.stop="onPay(o)">去支付</view>
          <view v-if="o.status === 1 || o.status === 2" class="act act--plain" @tap.stop="onRefund(o)">退票</view>
        </view>
      </view>
    </view>

    <view v-if="loaded && !orders.length" class="empty">暂无订单</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getOrderList, payOrder, cancelOrder, refundOrder, clearOrders } from '../../api/order'
import { useUserStore } from '../../store/user'
import { orderStatus, orderStatusColor, fmtTime, fmtPrice } from '../../utils/index'

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

onShow(() => { loadList() })

function loadList() {
  if (!user.isLogin) {
    orders.value = []
    loaded.value = true
    return
  }
  const params = {}
  if (cur.value !== '') params.status = cur.value
  getOrderList(params).then(d => {
    orders.value = d || []
    loaded.value = true
  }).catch(() => { loaded.value = true })
}

function switchTab(v) {
  cur.value = v
  loadList()
}

function goDetail(o) {
  uni.navigateTo({ url: `/pages/order/detail?id=${o.id}` })
}

function onPay(o) {
  payOrder(o.id).then(() => {
    uni.showToast({ title: '支付成功', icon: 'success' })
    loadList()
  }).catch(() => {})
}

function onCancel(o) {
  uni.showModal({
    title: '提示',
    content: '确定取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        cancelOrder(o.id).then(() => {
          uni.showToast({ title: '已取消', icon: 'none' })
          loadList()
        }).catch(() => {})
      }
    }
  })
}

function onRefund(o) {
  uni.showModal({
    title: '提示',
    content: '确定退票吗？退款将原路返回。',
    success: (res) => {
      if (res.confirm) {
        refundOrder(o.id).then(() => {
          uni.showToast({ title: '退票成功', icon: 'success' })
          loadList()
        }).catch(() => {})
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
    confirmColor: '#c62f2f',
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
.page { padding-bottom: 40rpx; }

.tabs {
  white-space: nowrap;
  background: #fff;
  padding: 16rpx 24rpx;
}
.tab {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 12rpx;
  font-size: 26rpx;
  color: $text-sub;
  border-radius: 30rpx;
  &.active { background: $brand-red; color: #fff; }
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 4rpx 24rpx 0;
}
.toolbar__btn {
  font-size: 24rpx;
  color: $text-sub;
  padding: 10rpx 0;
  &:active { opacity: 0.6; }
}

.order {
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
  &__top { display: flex; justify-content: space-between; align-items: center; }
  &__movie { font-size: 30rpx; font-weight: 600; }
  &__status { font-size: 26rpx; }
  &__meta { display: block; font-size: 24rpx; color: $text-sub; margin-top: 8rpx; }
  &__bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
  &__amount { color: $price-color; font-size: 34rpx; font-weight: 700; }
  &__actions { display: flex; }
}
.act {
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  margin-left: 16rpx;
  &--primary { background: $brand-red; color: #fff; }
  &--plain { color: $brand-red; border: 1rpx solid $brand-red; }
}

.empty { text-align: center; color: $text-sub; padding: 80rpx 0; }
</style>