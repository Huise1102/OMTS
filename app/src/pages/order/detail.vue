<template>
  <view class="page" v-if="order">
    <!-- 状态卡片 -->
    <view class="status-card">
      <text class="status-card__text" :style="{ color: orderStatusColor(order.status) }">{{ orderStatus(order.status) }}</text>
      <text class="status-card__no">订单号：{{ order.order_no }}</text>
    </view>

    <!-- 影票信息 -->
    <view class="card ticket">
      <movie-poster :title="order.movie_title" :width="100" :height="140" />
      <view class="ticket__info">
        <text class="ticket__title">{{ order.movie_title }}</text>
        <text class="ticket__meta">{{ order.cinema_name }} · {{ order.hall_name }}</text>
        <text class="ticket__meta">{{ order.show_date }} {{ fmtTime(order.show_time) }}</text>
        <text class="ticket__seats">座位：{{ seatText }}</text>
      </view>
    </view>

    <!-- 取票二维码 -->
    <view class="card" v-if="order.status === 1 || order.status === 2">
      <view class="card__title">取票二维码</view>
      <view class="qr">
        <view class="qr__box" :style="{ width: qrSize + 'px', height: qrSize + 'px', padding: (QR_CELL * QR_QUIET) + 'px' }">
          <view class="qr__grid" :style="{ width: qrGrid + 'px', height: qrGrid + 'px' }">
            <view v-for="(m, i) in qrFlat" :key="i" class="qr__cell" :class="{ dark: m }"></view>
          </view>
        </view>
        <text class="qr__code">{{ order.order_no }}</text>
        <text class="qr__tip">开场前凭此码到影院自助机扫码取票</text>
      </view>
    </view>

    <!-- 金额 -->
    <view class="card">
      <view class="row"><text class="row__label">票数</text><text class="row__val">{{ order.ticket_qty }} 张</text></view>
      <view class="row"><text class="row__label">实付金额</text><text class="row__val text-price">¥{{ fmtPrice(order.total_amount) }}</text></view>
      <view class="row" v-if="order.created_at"><text class="row__label">下单时间</text><text class="row__val">{{ order.created_at }}</text></view>
    </view>

    <!-- 操作 -->
    <view class="footer" v-if="order.status === 0 || order.status === 1 || order.status === 2">
      <view v-if="order.status === 0" class="footer__btn footer__btn--plain" @tap="onCancel">取消订单</view>
      <view v-if="order.status === 0" class="footer__btn" @tap="onPay">立即支付</view>
      <view v-if="order.status === 1 || order.status === 2" class="footer__btn footer__btn--plain" @tap="onRefund">申请退票</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import qrcode from 'qrcode-generator'
import { getOrderDetail, payOrder, cancelOrder, refundOrder } from '../../api/order'
import { orderStatus, orderStatusColor, fmtTime, fmtPrice } from '../../utils/index'

const order = ref(null)
const orderId = ref('')
const qrSize = ref(0)   // 含静区的总尺寸（px）
const qrGrid = ref(0)   // 模块网格尺寸（px）
const qrFlat = ref([])  // 拍平的模块数组（true=深色模块）
const QR_CELL = 5       // 每个模块像素大小，需与 .qr__cell 的 width/height 保持一致
const QR_QUIET = 4      // 静区模块数

const seatText = computed(() => {
  if (!order.value || !order.value.tickets) return ''
  return order.value.tickets.map(t => `${t.seat_row}排${t.seat_col}座`).join('、')
})

onLoad((options) => {
  orderId.value = options && options.id
  if (orderId.value) loadDetail()
})

function loadDetail() {
  getOrderDetail(orderId.value).then(d => {
    order.value = d
    nextTick(() => { if (d.status === 1 || d.status === 2) drawQR() })
  }).catch(() => {})
}

// 用 qrcode-generator 生成真实可扫的取票码，渲染为黑白网格（H5 / 小程序通用，无 canvas 依赖）
function drawQR() {
  if (!order.value) return
  const qr = qrcode(0, 'M') // 版本自动、纠错级别 M
  qr.addData('CINEMA:' + order.value.order_no)
  qr.make()

  const count = qr.getModuleCount()
  const flat = []
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) flat.push(qr.isDark(r, c))
  }
  qrFlat.value = flat
  qrGrid.value = count * QR_CELL
  qrSize.value = qrGrid.value + QR_CELL * QR_QUIET * 2
}

function onPay() {
  payOrder(orderId.value).then(() => {
    uni.showToast({ title: '支付成功', icon: 'success' })
    loadDetail()
  }).catch(() => {})
}

function onCancel() {
  uni.showModal({
    title: '提示',
    content: '确定取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        cancelOrder(orderId.value).then(() => {
          uni.showToast({ title: '已取消', icon: 'none' })
          loadDetail()
        }).catch(() => {})
      }
    }
  })
}

function onRefund() {
  uni.showModal({
    title: '提示',
    content: '确定退票吗？退款将原路返回。',
    success: (res) => {
      if (res.confirm) {
        refundOrder(orderId.value).then(() => {
          uni.showToast({ title: '退票成功', icon: 'success' })
          loadDetail()
        }).catch(() => {})
      }
    }
  })
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 180rpx; }

.status-card {
  background: $brand-red;
  padding: 40rpx 24rpx;
  display: flex;
  flex-direction: column;
  &__text { color: #fff; font-size: 40rpx; font-weight: 700; }
  &__no { color: rgba(255,255,255,0.85); font-size: 22rpx; margin-top: 8rpx; }
}

.ticket {
  display: flex;
  &__info { flex: 1; margin-left: 24rpx; display: flex; flex-direction: column; }
  &__title { font-size: 30rpx; font-weight: 600; }
  &__meta { font-size: 24rpx; color: $text-sub; margin-top: 8rpx; }
  &__seats { font-size: 26rpx; margin-top: 8rpx; }
}

.card__title { font-size: 30rpx; font-weight: 600; margin-bottom: 20rpx; }
.qr { display: flex; flex-direction: column; align-items: center; }
.qr__box {
  background: #fff;
  border: 2rpx dashed $brand-red;
  border-radius: 12rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr__grid {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
}
.qr__cell {
  width: 5px;
  height: 5px;
  box-sizing: border-box;
}
.qr__cell.dark { background: #1a1a1a; }
.qr__code { font-size: 22rpx; letter-spacing: 4rpx; word-break: break-all; text-align: center; color: $brand-red; margin-top: 12rpx; }
.qr__tip { font-size: 22rpx; color: $text-sub; margin-top: 8rpx; }

.row { display: flex; justify-content: space-between; padding: 14rpx 0; }
.row__label { color: $text-sub; font-size: 26rpx; }
.row__val { font-size: 26rpx; }

.footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: #fff;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  &__btn {
    flex: 1;
    background: $brand-red;
    color: #fff;
    text-align: center;
    border-radius: 44rpx;
    padding: 24rpx 0;
    font-size: 30rpx;
    &--plain { background: #fff; color: $brand-red; border: 1rpx solid $brand-red; margin-right: 20rpx; }
  }
}
</style>