<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="toolbar">
      <view class="search">
        <input
          class="search__input"
          v-model="keyword"
          placeholder="搜索影片 / 导演 / 主演"
          confirm-type="search"
          @confirm="onSearch"
        />
        <view class="search__btn" @tap="onSearch">搜索</view>
      </view>
    </view>

    <!-- 状态切换 -->
    <view class="tabs">
      <view
        v-for="t in statusTabs"
        :key="t.value"
        class="tab"
        :class="{ active: status === t.value }"
        @tap="switchStatus(t.value)"
      >{{ t.label }}</view>
    </view>

    <!-- 类型筛选 -->
    <scroll-view scroll-x class="cats" :show-scrollbar="false">
      <view class="cat" :class="{ active: typeId === '' }" @tap="switchType('')">全部</view>
      <view
        v-for="c in categories"
        :key="c.id"
        class="cat"
        :class="{ active: typeId === String(c.id) }"
        @tap="switchType(String(c.id))"
      >{{ c.name }}</view>
    </scroll-view>

    <!-- 排序 -->
    <view class="sorts">
      <view
        v-for="s in sortTabs"
        :key="s.value"
        class="sort"
        :class="{ active: sort === s.value }"
        @tap="switchSort(s.value)"
      >{{ s.label }}</view>
    </view>

    <!-- 列表 -->
    <view v-if="loading" class="list">
      <view v-for="i in 4" :key="i" class="movie">
        <skeleton-block width="150rpx" height="210rpx" :radius="20" />
        <view class="movie__info">
          <skeleton-block width="55%" height="36rpx" />
          <view class="movie__skeleton-line"><skeleton-block width="30%" height="24rpx" /></view>
          <view class="movie__skeleton-line"><skeleton-block width="45%" height="22rpx" /></view>
          <view class="movie__skeleton-line"><skeleton-block width="40%" height="22rpx" /></view>
        </view>
      </view>
    </view>
    <view v-else class="list">
      <view v-for="m in movies" :key="m.id" class="movie" @tap="goDetail(m)">
        <movie-poster :title="m.title" :sub="m.version" :width="150" :height="210" />
        <view class="movie__info">
          <text class="movie__title">
            <text
              v-for="(seg, i) in titleSegments(m.title)"
              :key="i"
              :class="{ hl: seg.hit }"
            >{{ seg.text }}</text>
          </text>
          <text class="movie__rating">{{ fmtRating(m.rating) }}分</text>
          <text class="movie__meta">{{ m.director || '未知' }} 导演</text>
          <text class="movie__meta">{{ m.duration }}分钟 · {{ m.language }}</text>
          <text class="movie__desc">{{ m.actors ? m.actors.split(',')[0] + ' 等主演' : '' }}</text>
        </view>
        <view class="movie__action">
          <view class="buy" @tap.stop="goBuy(m)">
            {{ m.status === 1 ? '购票' : '预售' }}
          </view>
        </view>
      </view>
    </view>

    <empty-state
      v-if="loaded && !movies.length"
      title="暂无相关影片"
      desc="换个关键词或类型试试"
    />

    <view v-if="loaded && movies.length" class="list-more">
      {{ loadingMore ? '加载中…' : (hasMore ? '' : '没有更多了') }}
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getCategory, getMovieList } from '../../api/movie'
import { useBookingStore } from '../../store/booking'
import { useFilterStore } from '../../store/filter'
import { fmtRating } from '../../utils/index'

const booking = useBookingStore()

const statusTabs = [
  { label: '全部', value: '' },
  { label: '热映', value: '1' },
  { label: '即将上映', value: '2' }
]
const sortTabs = [
  { label: '综合', value: '' },
  { label: '评分', value: 'rating' },
  { label: '最新', value: 'release' }
]

const keyword = ref('')
const status = ref('')
const typeId = ref('')
const sort = ref('')
const categories = ref([])
const movies = ref([])
const loaded = ref(false)
const loading = ref(true)
const pageSize = 10
const page = ref(1)
const hasMore = ref(true)
const loadingMore = ref(false)

function buildParams() {
  const params = { page: page.value, pageSize }
  if (status.value) params.status = status.value
  if (typeId.value) params.typeId = typeId.value
  if (keyword.value) params.keyword = keyword.value
  if (sort.value) params.sort = sort.value
  return params
}

function loadList(reset = true) {
  if (!reset) {
    if (loadingMore.value || !hasMore.value || loading.value) return Promise.resolve()
    loadingMore.value = true
  } else {
    page.value = 1
    hasMore.value = true
    loading.value = true
  }
  return getMovieList(buildParams()).then(d => {
    const list = d || []
    movies.value = reset ? list : movies.value.concat(list)
    hasMore.value = list.length === pageSize
  }).catch(() => {}).finally(() => {
    loaded.value = true
    loading.value = false
    loadingMore.value = false
  })
}

// 把片名按关键词拆成命中/未命中片段，仅命中部分高亮
function titleSegments(title) {
  const text = title || ''
  const kw = keyword.value.trim()
  if (!kw) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const target = kw.toLowerCase()
  const parts = []
  let from = 0
  let idx = lower.indexOf(target)
  while (idx >= 0) {
    if (idx > from) parts.push({ text: text.slice(from, idx), hit: false })
    parts.push({ text: text.slice(idx, idx + kw.length), hit: true })
    from = idx + kw.length
    idx = lower.indexOf(target, from)
  }
  if (from < text.length) parts.push({ text: text.slice(from), hit: false })
  return parts.length ? parts : [{ text, hit: false }]
}

onLoad(() => {
  getCategory().then(d => { categories.value = d || [] }).catch(() => {})
  loadList()
})

// 从首页通过 switchTab 进入时，消费 store 里的筛选条件并应用（tabBar 页无法用 navigateTo 传参）
onShow(() => {
  const filter = useFilterStore()
  const p = filter.consume()
  if (p.needReset) {
    status.value = ''
    typeId.value = ''
    keyword.value = ''
    sort.value = ''
  } else if (p.typeId || p.keyword) {
    status.value = ''
    sort.value = ''
    if (p.typeId) typeId.value = p.typeId
    if (p.keyword) keyword.value = p.keyword
  } else {
    return
  }
  loadList()
})

function onSearch() { loadList() }
onPullDownRefresh(() => { loadList().finally(() => uni.stopPullDownRefresh()) })
onReachBottom(() => {
  if (!hasMore.value || loadingMore.value) return
  page.value += 1
  loadList(false)
})
function switchStatus(v) { status.value = v; loadList() }
function switchType(v) { typeId.value = v; loadList() }
function switchSort(v) { sort.value = v; loadList() }
function goDetail(m) { uni.navigateTo({ url: `/pages/movie/detail?id=${m.id}` }) }
function goBuy(m) {
  booking.setMovie(m)
  uni.navigateTo({ url: `/pages/showtime/showtime?movieId=${m.id}` })
}
</script>

<style scoped lang="scss">
.page { padding-bottom: 48rpx; }

/* ---------- 搜索 ---------- */
.toolbar { padding: $sp-md $sp-md 0; }

.search {
  display: flex;
  align-items: center;
  padding: 8rpx 8rpx 8rpx 28rpx;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-pill;
  box-shadow: $shadow-card;

  &__input {
    flex: 1;
    font-size: $fs-small;
    height: 64rpx;
    color: $text-main;
  }

  &__btn {
    background: $c-primary;
    color: #fff;
    border-radius: $radius-pill;
    padding: 16rpx 34rpx;
    font-size: $fs-small;
    font-weight: 600;
  }
}

/* ---------- 状态切换（下划线式） ---------- */
.tabs {
  display: flex;
  margin: $sp-md $sp-md 0;
  border-bottom: 1rpx solid $border-color;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0 18rpx;
  font-size: $fs-body;
  color: $text-sub;
  position: relative;

  &.active {
    color: $text-main;
    font-weight: 700;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -1rpx;
      transform: translateX(-50%);
      width: 56rpx;
      height: 4rpx;
      border-radius: 4rpx;
      background: $c-primary;
    }
  }
}

/* ---------- 类型筛选 ---------- */
.cats {
  white-space: nowrap;
  padding: $sp-md $sp-md 0;
}

.cat {
  display: inline-block;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-pill;
  padding: 10rpx 28rpx;
  margin-right: $sp-sm;
  font-size: $fs-caption;
  color: $text-sub;

  &.active {
    background: $c-primary;
    border-color: $c-primary;
    color: #fff;
    font-weight: 600;
  }
}

/* ---------- 排序 ---------- */
.sorts {
  display: flex;
  padding: $sp-md $sp-md 0;
}

.sort {
  margin-right: 44rpx;
  font-size: $fs-small;
  color: $text-sub;

  &.active {
    color: $c-primary;
    font-weight: 700;
  }
}

/* ---------- 影片列表 ---------- */
.list { padding: $sp-sm $sp-md 0; }

.movie {
  display: flex;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-radius: $radius-md;
  padding: $sp-md;
  margin-top: $sp-sm;
  box-shadow: $shadow-card;

  &__info {
    flex: 1;
    margin-left: $sp-md;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    font-size: $fs-title;
    font-weight: 700;
    color: $text-main;
  }

  &__skeleton-line {
    margin-top: 12rpx;
  }

  &__rating {
    display: inline-block;
    align-self: flex-start;
    margin-top: 8rpx;
    font-size: $fs-caption;
    font-weight: 700;
    color: $c-gold;
    background: $c-gold-soft;
    border-radius: $radius-sm;
    padding: 2rpx 12rpx;
  }

  &__meta {
    margin-top: 8rpx;
    font-size: $fs-caption;
    color: $text-sub;
  }

  &__desc {
    margin-top: 8rpx;
    font-size: $fs-caption;
    color: $text-light;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__action {
    display: flex;
    align-items: center;
    padding-left: $sp-sm;
  }
}

.buy {
  background: $c-primary;
  color: #fff;
  border-radius: $radius-pill;
  padding: 14rpx 32rpx;
  font-size: $fs-caption;
  font-weight: 600;

  &:active { background: $c-primary-dark; }
}

/* 搜索命中片段：主题红浅底 */
.hl {
  color: $c-primary;
  background: $c-primary-soft;
  border-radius: 8rpx;
  padding: 0 4rpx;
}

.list-more {
  text-align: center;
  font-size: $fs-caption;
  color: $text-light;
  padding: $sp-lg 0;
}
</style>