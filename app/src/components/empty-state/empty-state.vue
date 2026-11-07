<template>
  <view class="empty-state">
    <text class="empty-state__title">{{ title }}</text>
    <text v-if="desc" class="empty-state__desc">{{ desc }}</text>
    <view v-if="actionText" class="empty-state__action btn-plain" @tap="onAct">{{ actionText }}</view>
  </view>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '暂无内容' },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' }
})

const emit = defineEmits(['action'])

function onAct() {
  emit('action')
}
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx $sp-xl;

  &__title {
    font-size: $fs-body;
    color: $text-sub;
    text-align: center;
  }

  &__desc {
    margin-top: $sp-xs;
    font-size: $fs-caption;
    color: $text-light;
    text-align: center;
  }

  &__action {
    margin-top: $sp-lg;
    min-width: 240rpx;
    padding: 18rpx 48rpx;
    font-size: $fs-small;
  }
}
</style>
