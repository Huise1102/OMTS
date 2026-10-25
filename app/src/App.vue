<script>
// 应用根组件：仅承载全局样式，无业务逻辑
export default {}
</script>

<style lang="scss">
/* ============================================================
   全局基础样式（胶片暖棕）
   这里只放跨页面复用的原子类，页面私有样式仍写在各自 <style scoped> 中。
   ============================================================ */

page {
  background-color: $bg-color;
  color: $text-main;
  font-size: $fs-body;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

/* ---------- 卡片 ---------- */
.card {
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $sp-md;
  margin: $sp-sm $sp-md;
  box-shadow: $shadow-card;
}

/* 无边框的分组卡片（用于列表内的连续区块） */
.panel {
  background: $card-bg;
  border-radius: $radius-md;
  padding: $sp-lg $sp-md;
}

/* ---------- 按钮 ---------- */
.btn-primary {
  background: $c-primary;
  color: #fff;
  border-radius: $radius-pill;
  font-size: $fs-body;
  font-weight: 600;
  text-align: center;
  padding: 22rpx 0;
  border: none;

  &:active {
    background: $c-primary-dark;
  }
}

.btn-gold {
  background: $c-gold;
  color: #fff;
  border-radius: $radius-pill;
  font-size: $fs-body;
  font-weight: 600;
  text-align: center;
  padding: 22rpx 0;
  border: none;
}

.btn-plain {
  background: transparent;
  color: $c-primary;
  border: 1rpx solid $c-primary;
  border-radius: $radius-pill;
  font-size: $fs-body;
  text-align: center;
  padding: 20rpx 0;
}

.btn-ghost {
  background: $surface-2;
  color: $text-main;
  border-radius: $radius-pill;
  font-size: $fs-small;
  text-align: center;
  padding: 14rpx 28rpx;
}

/* ---------- 文字 ---------- */
.text-main { color: $text-main; }
.text-sub { color: $text-sub; }
.text-light { color: $text-light; }

.text-price {
  color: $price-color;
  font-weight: 700;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $sp-md;
  margin-bottom: $sp-sm;
}

.section-head__title {
  display: flex;
  align-items: center;
  font-size: $fs-title;
  font-weight: 700;
  color: $text-main;

  /* 左侧金色短竖线装饰 */
  &::before {
    content: '';
    width: 6rpx;
    height: 30rpx;
    margin-right: 14rpx;
    border-radius: 6rpx;
    background: $c-gold;
  }
}

.section-head__more {
  font-size: $fs-small;
  color: $text-sub;
}

/* ---------- 标签胶囊 ---------- */
.chip {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 26rpx;
  border-radius: $radius-pill;
  border: 1rpx solid $border-color;
  background: $card-bg;
  font-size: $fs-small;
  color: $text-sub;

  &.active {
    background: $c-primary;
    border-color: $c-primary;
    color: #fff;
    font-weight: 600;
  }
}

.chip-soft {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 16rpx;
  border-radius: $radius-sm;
  background: $c-primary-soft;
  font-size: $fs-caption;
  color: $c-primary;
}

/* ---------- 票根分割线（两侧半圆缺口） ---------- */
.ticket-cut {
  position: relative;
  height: 2rpx;
  margin: $sp-md 0;
  border-top: 2rpx dashed $border-color;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -16rpx;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background: $bg-color;
  }

  &::before { left: -44rpx; }
  &::after { right: -44rpx; }
}

/* ---------- 空态 ---------- */
.empty {
  text-align: center;
  color: $text-light;
  padding: 100rpx 0;
  font-size: $fs-small;
}

/* ---------- 分割线 ---------- */
.hr {
  height: 1rpx;
  background: $border-color;
}
</style>
