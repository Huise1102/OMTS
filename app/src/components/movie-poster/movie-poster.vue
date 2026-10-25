<template>
  <view
    class="poster"
    :style="{ width: size.width, height: size.height, background: bg }"
  >
    <text class="poster__title" :style="{ fontSize }">{{ title }}</text>
    <view class="poster__rule"></view>
    <text v-if="sub" class="poster__sub">{{ sub }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  // 数字按 rpx 处理；也可传 '100%' 这类字符串
  width: { type: [Number, String], default: 140 },
  height: { type: [Number, String], default: 196 }
})

const px = (v) => (typeof v === 'number' ? v + 'rpx' : v)

const size = computed(() => {
  const w = typeof props.width === 'number' ? props.width : 300
  return {
    width: px(props.width),
    height: px(props.height),
    padding: w < 120 ? '8rpx' : w < 180 ? '12rpx' : '16rpx'
  }
})

// 小尺寸海报按比例缩小字号，避免片名在窄色块里折成多行
const fontSize = computed(() => {
  const w = typeof props.width === 'number' ? props.width : 300
  if (w < 120) return '20rpx'
  if (w < 180) return '24rpx'
  if (w < 260) return '28rpx'
  return '34rpx'
})

// 依据片名生成稳定配色（暖棕胶片色调，无图片素材、无图标）
const palettes = [
  'linear-gradient(150deg, #C1663F, #8A3B21)', // 陶土
  'linear-gradient(150deg, #A85C42, #6E3623)', // 赤褐
  'linear-gradient(150deg, #8C6A3F, #5A3F22)', // 黄铜
  'linear-gradient(150deg, #7A6A55, #463A2E)', // 胡桃
  'linear-gradient(150deg, #B4432F, #7A2A1C)', // 砖红
  'linear-gradient(150deg, #5C6B57, #33402F)', // 橄榄
  'linear-gradient(150deg, #536476, #2E3843)'  // 石板蓝
]

const bg = computed(() => {
  let hash = 0
  const s = props.title || '电影'
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) & 0xffff
  return palettes[hash % palettes.length]
})
</script>

<style scoped lang="scss">
.poster {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  box-sizing: border-box;
  border-radius: $radius-md;
  color: #fff;
  overflow: hidden;

  &__title {
    font-weight: 600;
    text-align: center;
    line-height: 1.35;
    word-break: break-all;
    text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.18);
  }

  /* 片名下的金色短线，像海报上的烫金装饰 */
  &__rule {
    width: 28rpx;
    height: 2rpx;
    margin-top: 12rpx;
    background: rgba(255, 255, 255, 0.55);
  }

  &__sub {
    margin-top: 10rpx;
    font-size: 20rpx;
    letter-spacing: 1rpx;
    opacity: 0.9;
  }
}
</style>
