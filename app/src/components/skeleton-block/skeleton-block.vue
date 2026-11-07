<template>
  <view class="skeleton" :style="style"></view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: [String, Number], default: '100%' },
  height: { type: [String, Number], default: 32 },
  radius: { type: [String, Number], default: 12 }
})

const px = (v) => (typeof v === 'number' ? v + 'rpx' : v)

// 数值默认按 rpx 处理；百分比、rpx 等字符串原样使用
const style = computed(() => ({
  width: px(props.width),
  height: px(props.height),
  borderRadius: px(props.radius)
}))
</script>

<style scoped lang="scss">
.skeleton {
  background: $surface-2;
  animation: skeleton-pulse 1.2s ease-in-out infinite alternate;
}

/* 只呼吸透明度，避免彩色 shimmer */
@keyframes skeleton-pulse {
  from { opacity: 0.55; }
  to { opacity: 0.9; }
}
</style>
