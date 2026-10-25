<template>
  <view class="page">
    <view class="toolbar">
      <view class="toolbar__btn" @tap="toggleSessions">历史会话</view>
      <view class="toolbar__btn" @tap="newSession">新会话</view>
      <view class="toolbar__btn toolbar__btn--ghost" @tap="onClearSessions">清空历史</view>
    </view>

    <scroll-view v-if="showSessions" scroll-y class="sessions">
      <view v-for="s in sessions" :key="s.session_id" class="session" @tap="openSession(s)">
        <text class="session__title">{{ s.title || '未命名会话' }}</text>
        <text class="session__time">{{ s.updated_at }}</text>
      </view>
      <view v-if="!sessions.length" class="session__empty">暂无历史会话</view>
    </scroll-view>

    <scroll-view
      scroll-y
      class="msg-list"
      :scroll-into-view="scrollId"
      scroll-with-animation
    >
      <view
        v-for="(m, i) in messages"
        :key="i"
        :id="'m' + i"
        class="msg"
        :class="m.role === 'user' ? 'msg--user' : 'msg--bot'"
      >
        <view class="bubble">{{ m.content }}</view>

        <!-- 待确认操作卡片（下单 / 退票） -->
        <view v-if="m.action" class="confirm">
          <text class="confirm__title">{{ m.action.title || '确认操作' }}</text>
          <text class="confirm__summary">{{ m.action.summary }}</text>
          <view class="confirm__btns">
            <view class="confirm__btn confirm__btn--cancel" @tap="dismissAction(i)">取消</view>
            <view class="confirm__btn confirm__btn--ok" @tap="confirmAction(i)">确认</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="inputbar">
      <input
        class="inputbar__input"
        v-model="input"
        :disabled="sending"
        placeholder="如：帮我订一张票"
        confirm-type="send"
        @confirm="send"
      />
      <view class="inputbar__btn" @tap="send">发送</view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { sendChat, getSessions, getHistory, clearSessions } from '../../api/chat'
import { createOrder, refundOrder } from '../../api/order'
import { useUserStore } from '../../store/user'

const user = useUserStore()

const GREETING = '您好，我是星辉影城的智能购票助手。您可以问我「最近有什么好看的电影」「帮我订一张票」或「帮我退票」。'

const messages = ref([])
const input = ref('')
const sessionId = ref('')
const sending = ref(false)
const scrollId = ref('')
const sessions = ref([])
const showSessions = ref(false)

onLoad(() => {
  if (!user.isLogin) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 300)
    return
  }
  messages.value.push({ role: 'assistant', content: GREETING })
})

function toggleSessions() {
  showSessions.value = !showSessions.value
  if (showSessions.value) loadSessions()
}

function loadSessions() {
  getSessions().then(d => { sessions.value = d || [] }).catch(() => {})
}

function openSession(s) {
  showSessions.value = false
  sessionId.value = s.session_id
  getHistory(s.session_id).then(d => {
    messages.value = (d || []).map(m => ({ role: m.role, content: m.content }))
    scrollBottom()
  }).catch(() => {})
}

function newSession() {
  sessionId.value = ''
  showSessions.value = false
  messages.value = [{ role: 'assistant', content: GREETING }]
  scrollBottom()
}

// 清空全部历史会话（同时重置当前对话）
function onClearSessions() {
  uni.showModal({
    title: '清空历史会话',
    content: '将删除全部历史会话与聊天记录，删除后不可恢复。当前对话也会重置。',
    confirmText: '清空',
    confirmColor: '#B9462F',
    success: (res) => {
      if (!res.confirm) return
      clearSessions().then(d => {
        sessions.value = []
        newSession()
        uni.showToast({ title: `已清除 ${(d && d.count) || 0} 个会话`, icon: 'none' })
      }).catch(() => {})
    }
  })
}

function scrollBottom() {
  nextTick(() => { scrollId.value = 'm' + (messages.value.length - 1) })
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  input.value = ''
  messages.value.push({ role: 'user', content: text })
  sending.value = true
  try {
    const d = await sendChat({ message: text, sessionId: sessionId.value || undefined })
    sessionId.value = d.sessionId
    const msg = { role: 'assistant', content: d.reply || '' }
    if (d.pendingAction) msg.action = d.pendingAction
    messages.value.push(msg)
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，智能助手暂时不可用（请确认后端已配置通义千问 API Key），请稍后重试。'
    })
  } finally {
    sending.value = false
    scrollBottom()
  }
}

// 取消待确认操作
function dismissAction(i) {
  messages.value[i].action = null
  messages.value[i].content += '\n（已取消该操作）'
  scrollBottom()
}

// 确认待确认操作：触发真实下单 / 退票
function confirmAction(i) {
  const action = messages.value[i].action
  if (!action) return

  if (action.type === 'create_order') {
    createOrder(action.params).then(d => {
      messages.value[i].action = null
      const total = Number(d.totalAmount || 0).toFixed(2)
      messages.value.push({
        role: 'assistant',
        content: `已成功下单，订单号 ${d.orderNo}，合计 ¥${total}，请尽快支付。`
      })
      scrollBottom()
      uni.showModal({
        title: '下单成功',
        content: '是否前往订单详情进行支付？',
        success: (res) => {
          if (res.confirm) uni.navigateTo({ url: `/pages/order/detail?id=${d.orderId}` })
        }
      })
    }).catch(() => {})
  } else if (action.type === 'refund_order') {
    refundOrder(action.params.id).then(() => {
      messages.value[i].action = null
      messages.value.push({ role: 'assistant', content: '退票成功，退款将原路返回。' })
      scrollBottom()
    }).catch(() => {})
  }
}
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
}

/* ---------- 顶部工具条 ---------- */
.toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 12rpx $sp-md;
  background: $bg-color;
  border-bottom: 1rpx solid $border-color;
}

.toolbar__btn {
  margin-left: $sp-sm;
  padding: 8rpx 24rpx;
  font-size: $fs-caption;
  color: $c-primary;
  border: 1rpx solid $c-primary;
  border-radius: $radius-pill;

  &--ghost {
    color: $text-sub;
    border-color: $border-color;
  }
}

/* ---------- 历史会话 ---------- */
.sessions {
  max-height: 480rpx;
  background: $card-bg;
  border-bottom: 1rpx solid $border-color;
}

.session {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx $sp-md;
  border-bottom: 1rpx dashed $border-color;

  &:last-child { border-bottom: none; }
}

.session__title {
  font-size: $fs-small;
  color: $text-main;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session__time {
  flex-shrink: 0;
  margin-left: $sp-sm;
  font-size: 20rpx;
  color: $text-light;
}

.session__empty {
  text-align: center;
  color: $text-light;
  font-size: $fs-caption;
  padding: 30rpx 0;
}

/* ---------- 消息列表 ---------- */
.msg-list {
  flex: 1;
  padding: $sp-md;
  box-sizing: border-box;
  overflow: hidden;
}

.msg {
  display: flex;
  flex-direction: column;
  margin-bottom: $sp-md;
}

.msg--user { align-items: flex-end; }
.msg--bot { align-items: flex-start; }

.bubble {
  max-width: 76%;
  box-sizing: border-box;
  padding: 20rpx $sp-md;
  border-radius: $radius-md;
  font-size: $fs-body;
  line-height: 1.65;
  white-space: pre-line;
  word-break: normal;
  overflow-wrap: break-word;
}

.msg--user .bubble {
  background: $c-primary;
  color: #fff;
  border-bottom-right-radius: 6rpx;
  box-shadow: 0 6rpx 16rpx rgba(185, 70, 47, 0.18);
}

.msg--bot .bubble {
  background: $card-bg;
  color: $text-main;
  border: 1rpx solid $border-color;
  border-bottom-left-radius: 6rpx;
}

/* ---------- 待确认卡片 ---------- */
.confirm {
  display: flex;
  flex-direction: column;
  width: 84%;
  margin-top: 12rpx;
  padding: $sp-md;
  background: $card-bg;
  border: 1rpx solid $border-color;
  border-left: 6rpx solid $c-gold;
  border-radius: $radius-md;
  box-shadow: $shadow-card;

  &__title {
    font-size: $fs-body;
    font-weight: 700;
    color: $text-main;
  }

  &__summary {
    margin-top: 12rpx;
    font-size: $fs-small;
    color: $text-sub;
    line-height: 1.6;
  }

  &__btns {
    display: flex;
    justify-content: flex-end;
    margin-top: $sp-md;
  }

  &__btn {
    margin-left: $sp-sm;
    padding: 12rpx 34rpx;
    border-radius: $radius-pill;
    font-size: $fs-caption;

    &--cancel {
      color: $text-sub;
      border: 1rpx solid $border-color;
    }

    &--ok {
      background: $c-primary;
      color: #fff;
      font-weight: 600;
    }
  }
}

/* ---------- 输入栏 ---------- */
.inputbar {
  display: flex;
  align-items: center;
  padding: 16rpx $sp-md calc(16rpx + env(safe-area-inset-bottom));
  background: $card-bg;
  border-top: 1rpx solid $border-color;

  &__input {
    flex: 1;
    margin-right: $sp-sm;
    padding: 16rpx 30rpx;
    background: $surface-2;
    border-radius: $radius-pill;
    font-size: $fs-body;
    color: $text-main;
  }

  &__btn {
    background: $c-primary;
    color: #fff;
    border-radius: $radius-pill;
    padding: 16rpx 34rpx;
    font-size: $fs-body;
    font-weight: 600;
  }
}
</style>