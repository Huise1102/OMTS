<template>
  <view
    class="poster"
    :style="{ width: width + 'rpx', height: height + 'rpx', background: bg }"
  >
    <text class="poster__title">{{ title }}</text>
    <text v-if="sub" class="poster__sub">{{ sub }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  width: { type: Number, default: 140 },
  height: { type: Number, default: 196 }
})

// 依据片名生成稳定配色（影院风格渐变，无 AI 图片、无奇怪图标）
const palettes = [
  'linear-gradient(135deg, #C8102E, #7A0A1C)',
  'linear-gradient(135deg, #2B4C7E, #16263F)',
  'linear-gradient(135deg, #C9A86A, #8A6D33)',
  'linear-gradient(135deg, #4E9F6D, #1F5235)',
  'linear-gradient(135deg, #7A5C9E, #3A2B52)',
  'linear-gradient(135deg, #D05A2C, #7A3315)'
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
  border-radius: 12rpx;
  color: #fff;
  overflow: hidden;
  &__title {
    font-size: 26rpx;
    font-weight: 600;
    text-align: center;
    line-height: 1.3;
    word-break: break-all;
  }
  &__sub {
    margin-top: 10rpx;
    font-size: 20rpx;
    opacity: 0.92;
  }
}
</style>