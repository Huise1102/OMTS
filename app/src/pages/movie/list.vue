<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="toolbar">
      <view class="search">
        <input
          class="search__input"
          v-model="keyword"
          placeholder="搜索影片名称"
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
    <view class="list">
      <view v-for="m in movies" :key="m.id" class="movie" @tap="goDetail(m)">
        <movie-poster :title="m.title" :sub="m.version" :width="120" :height="168" />
        <view class="movie__info">
          <text class="movie__title">{{ m.title }}</text>
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

    <view v-if="loaded && !movies.length" class="empty">暂无相关影片</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
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

function loadList() {
  const params = {}
  if (status.value) params.status = status.value
  if (typeId.value) params.typeId = typeId.value
  if (keyword.value) params.keyword = keyword.value
  if (sort.value) params.sort = sort.value
  getMovieList(params).then(d => {
    movies.value = d || []
    loaded.value = true
  }).catch(() => { loaded.value = true })
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
.page { padding-bottom: 40rpx; }

.toolbar { padding: 20rpx 24rpx 0; }
.search {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40rpx;
  padding: 8rpx 8rpx 8rpx 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  &__input { flex: 1; font-size: 26rpx; }
  &__btn {
    background: $brand-red;
    color: #fff;
    border-radius: 32rpx;
    padding: 14rpx 32rpx;
    font-size: 26rpx;
  }
}

.tabs {
  display: flex;
  margin: 20rpx 24rpx 0;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: $text-sub;
  &.active { color: $brand-red; font-weight: 600; }
}

.cats { white-space: nowrap; padding: 20rpx 24rpx 0; }
.cat {
  display: inline-block;
  background: #fff;
  border: 1rpx solid $border-color;
  border-radius: 30rpx;
  padding: 10rpx 28rpx;
  margin-right: 16rpx;
  font-size: 24rpx;
  color: $text-sub;
  &.active { background: $brand-red; color: #fff; border-color: $brand-red; }
}

.sorts { display: flex; padding: 20rpx 24rpx 0; }
.sort {
  margin-right: 40rpx;
  font-size: 26rpx;
  color: $text-sub;
  &.active { color: $brand-red; font-weight: 600; }
}

.list { padding: 8rpx 24rpx 0; }
.movie {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
  &__info { flex: 1; margin-left: 24rpx; display: flex; flex-direction: column; }
  &__title { font-size: 30rpx; font-weight: 600; }
  &__rating { color: $price-color; font-size: 24rpx; margin-top: 6rpx; }
  &__meta { font-size: 24rpx; color: $text-sub; margin-top: 6rpx; }
  &__desc { font-size: 22rpx; color: $text-sub; margin-top: 6rpx; }
  &__action { display: flex; align-items: center; }
}
.buy {
  background: $brand-red;
  color: #fff;
  border-radius: 34rpx;
  padding: 14rpx 34rpx;
  font-size: 26rpx;
}

.empty { text-align: center; color: $text-sub; padding: 80rpx 0; }
</style>