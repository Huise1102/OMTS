<template>
  <view class="page">
    <!-- 购票取票流程 -->
    <view class="card">
      <view class="card__title">购票取票流程</view>
      <view v-for="(s, i) in steps" :key="i" class="step">
        <view class="step__index">{{ i + 1 }}</view>
        <view class="step__body">
          <text class="step__title">{{ s.title }}</text>
          <text class="step__desc">{{ s.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 影厅座位说明 -->
    <view class="card">
      <view class="card__title">影厅座位说明</view>
      <view v-for="(s, i) in seatNotes" :key="i" class="note">
        <text class="note__dot"></text>
        <text class="note__text">{{ s }}</text>
      </view>
    </view>

    <!-- 文明观影守则 -->
    <view class="card">
      <view class="card__title">文明观影守则</view>
      <view v-for="(s, i) in rules" :key="i" class="note">
        <text class="note__text">{{ i + 1 }}. {{ s }}</text>
      </view>
    </view>

    <!-- 会员与优惠 -->
    <view class="card">
      <view class="card__title">会员与优惠说明</view>
      <view v-for="(s, i) in discounts" :key="i" class="note">
        <text class="note__dot"></text>
        <text class="note__text">{{ s }}</text>
      </view>
    </view>

    <!-- 常见问题 FAQ -->
    <view class="card">
      <view class="card__title">常见问题</view>
      <view v-for="(f, i) in faq" :key="i" class="faq">
        <view class="faq__head" @tap="toggle(i)">
          <text class="faq__q">{{ f.q }}</text>
          <text class="faq__arrow">{{ openIndex === i ? '收起' : '展开' }}</text>
        </view>
        <text v-if="openIndex === i" class="faq__a">{{ f.a }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const openIndex = ref(0)

const steps = [
  { title: '选片', desc: '在首页或影片页选择想看的热映影片。' },
  { title: '选场次', desc: '选择放映日期、影院与具体场次。' },
  { title: '选座位', desc: '在座位图上选择可售座位，确认金额。' },
  { title: '支付取票', desc: '模拟支付成功后，凭取票二维码到影院自助机取票。' }
]

const seatNotes = [
  '最佳观影区通常位于影厅中后部、靠近银幕居中位置。',
  '情侣座为双人连座，需同时选择两个相邻座位。',
  '无障碍座位为行动不便观众预留，请勿占用。',
  '座位图灰色代表已售，红色代表您的已选座位。'
]

const rules = [
  '请提前 10 分钟入场，电影开场后请保持安静。',
  '观影时请将手机调至静音，勿使用闪光灯。',
  '请勿在影厅内吸烟、饮食味道过重的食物。',
  '请照看好随行儿童，勿追逐打闹、随意走动。',
  '散场时请带走随身垃圾，文明有序离场。'
]

const discounts = [
  '会员购票享 9 折优惠，会员日更有额外折扣。',
  '学生凭有效证件可享受学生票优惠。',
  '1.3 米以下儿童免票（不占座），一名成人限带一名儿童。',
  '每周二为会员特惠日，部分场次低至半价。'
]

const faq = [
  { q: '如何取票？', a: '电影开场前，凭订单详情里的取票二维码到影院自助取票机扫码取票。' },
  { q: '可以退票吗？', a: '已支付且未开场的电影票支持在线退票，退款将原路返回。' },
  { q: '儿童需要购票吗？', a: '1.3 米以下儿童观影免票（不占座），一名成人限带一名儿童。' },
  { q: '如何修改观影场次？', a: '本系统暂不支持改签，如需更换场次请先退票后重新购票。' },
  { q: '支付失败怎么办？', a: '请在订单列表重新发起支付；若多次失败请联系影院客服。' }
]

function toggle(i) {
  openIndex.value = openIndex.value === i ? -1 : i
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 48rpx; }

.card__title {
  display: flex;
  align-items: center;
  font-size: $fs-title;
  font-weight: 700;
  margin-bottom: $sp-md;

  &::before {
    content: '';
    width: 6rpx;
    height: 28rpx;
    margin-right: 14rpx;
    border-radius: 6rpx;
    background: $c-gold;
  }
}

/* ---------- 流程步骤 ---------- */
.step {
  display: flex;
  margin-bottom: $sp-md;

  &:last-child { margin-bottom: 0; }
}

.step__index {
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: $c-primary-soft;
  color: $c-primary;
  text-align: center;
  line-height: 44rpx;
  font-size: $fs-caption;
  font-weight: 700;
}

.step__body {
  flex: 1;
  margin-left: $sp-sm;
}

.step__title {
  display: block;
  font-size: $fs-body;
  font-weight: 600;
  color: $text-main;
}

.step__desc {
  display: block;
  margin-top: 4rpx;
  font-size: $fs-caption;
  color: $text-sub;
  line-height: 1.6;
}

/* ---------- 列表条目 ---------- */
.note {
  display: flex;
  margin-bottom: 14rpx;

  &:last-child { margin-bottom: 0; }
}

.note__dot {
  flex-shrink: 0;
  width: 10rpx;
  height: 10rpx;
  margin: 14rpx 16rpx 0 0;
  border-radius: 50%;
  background: $c-gold;
}

.note__text {
  flex: 1;
  font-size: $fs-small;
  color: $text-main;
  line-height: 1.7;
}

/* ---------- FAQ ---------- */
.faq {
  padding: 18rpx 0;
  border-bottom: 1rpx dashed $border-color;

  &:last-child { border-bottom: none; }
}

.faq__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq__q {
  flex: 1;
  font-size: $fs-body;
  color: $text-main;
}

.faq__arrow {
  flex-shrink: 0;
  margin-left: $sp-sm;
  font-size: $fs-caption;
  color: $c-gold;
}

.faq__a {
  display: block;
  margin-top: 12rpx;
  font-size: $fs-caption;
  color: $text-sub;
  line-height: 1.7;
}
</style>