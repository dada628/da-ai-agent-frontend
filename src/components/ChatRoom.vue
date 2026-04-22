<template>
  <div class="chat-wrap">
    <header class="chat-header" :style="{ background: themeColor }">
      <router-link class="back" to="/">← 返回主页</router-link>
      <div class="title-area">
        <span class="avatar">{{ avatar }}</span>
        <div>
          <h2>{{ title }}</h2>
          <small v-if="chatId">会话 ID：{{ chatId }}</small>
        </div>
      </div>
      <button class="clear-btn" @click="handleClear">清空对话</button>
    </header>

    <main class="messages" ref="messageListRef">
      <div v-if="messages.length === 0" class="empty">
        <div class="empty-title">{{ emptyTitle }}</div>
        <div class="empty-desc">{{ emptyDesc }}</div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-row"
        :class="{ 'is-user': msg.role === 'user' }"
      >
        <div class="bubble-wrap">
          <div class="bubble" :class="msg.role">
            <template v-if="msg.role === 'ai' && !msg.content && msg.pending === 'waiting'">
              <span class="typing-dots"><i></i><i></i><i></i></span>
            </template>
            <template v-else>
              <pre class="bubble-text">{{ msg.content }}<span
                  v-if="msg.pending === 'streaming'"
                  class="caret"
                >▍</span></pre>
            </template>
          </div>
          <div class="meta">{{ formatTime(msg.ts) }}</div>
        </div>
        <div class="avatar" :class="msg.role">
          {{ msg.role === 'user' ? '🙂' : avatar }}
        </div>
      </div>
    </main>

    <footer class="input-bar">
      <textarea
        v-model="input"
        class="input"
        rows="1"
        placeholder="输入内容，Enter 发送，Shift + Enter 换行"
        @keydown="handleKeydown"
        :disabled="loading"
      ></textarea>
      <button
        class="send"
        :style="{ background: themeColor }"
        :disabled="!canSend"
        @click="handleSend"
      >
        {{ loading ? '生成中…' : '发送' }}
      </button>
    </footer>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  avatar: { type: String, default: '🤖' },
  themeColor: { type: String, default: '#6a8bff' },
  chatId: { type: String, default: '' },
  emptyTitle: { type: String, default: '开始新的对话吧' },
  emptyDesc: { type: String, default: '输入你的问题，AI 会实时流式回答' },
  // 父组件提供：(message, { onChunk, onDone, onError }) => EventSource | { close(): void }
  sendFn: { type: Function, required: true },
})

const emit = defineEmits(['clear'])

const input = ref('')
const messages = ref([])
const loading = ref(false)
const currentStream = ref(null)
const messageListRef = ref(null)

const canSend = computed(() => input.value.trim().length > 0 && !loading.value)

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 用户若手动往上翻看历史（距底 > 80px），就不再自动把他拽回底部
function isAtBottom() {
  const el = messageListRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

function scrollToBottom(force = false) {
  const shouldScroll = force || isAtBottom()
  nextTick(() => {
    if (!shouldScroll) return
    const el = messageListRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!canSend.value) return
  const text = input.value.trim()
  input.value = ''

  // 用户消息：普通对象 push 进响应式数组即可
  messages.value.push({
    id: uid(),
    role: 'user',
    content: text,
    ts: Date.now(),
  })

  // AI 消息：用 reactive() 把整个对象变成响应式代理，
  // 这样之后无论从哪里持有 aiMsg 的引用，aiMsg.content += chunk 都会触发重新渲染
  // 状态机：
  //   waiting   - 已发请求，等第一个 chunk（显示三个点）
  //   streaming - 正在持续接收（显示闪烁光标）
  //   done      - 完成（无光标）
  const aiMsg = reactive({
    id: uid(),
    role: 'ai',
    content: '',
    pending: 'waiting',
    ts: Date.now(),
  })
  messages.value.push(aiMsg)
  scrollToBottom(true)

  loading.value = true
  currentStream.value = props.sendFn(text, {
    onChunk: (chunk) => {
      if (!chunk) return
      aiMsg.pending = 'streaming'
      aiMsg.content += chunk
      scrollToBottom() // 自动跟随（用户滚到上面看历史时不会打扰）
    },
    onDone: () => {
      aiMsg.pending = 'done'
      if (!aiMsg.content) aiMsg.content = '(无内容)'
      loading.value = false
      currentStream.value = null
    },
    onError: (err) => {
      aiMsg.pending = 'done'
      const msg = typeof err === 'string' ? err : '请求失败，请检查后端是否在运行'
      if (!aiMsg.content) aiMsg.content = `（出错了：${msg}）`
      loading.value = false
      currentStream.value = null
    },
  })
}

function handleClear() {
  if (currentStream.value && typeof currentStream.value.close === 'function') {
    currentStream.value.close()
    currentStream.value = null
  }
  messages.value = []
  loading.value = false
  emit('clear')
}

watch(
  () => messages.value.length,
  () => scrollToBottom()
)

onBeforeUnmount(() => {
  if (currentStream.value && typeof currentStream.value.close === 'function') {
    currentStream.value.close()
  }
})
</script>

<style scoped>
.chat-wrap {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 40px rgba(30, 41, 59, 0.06);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  color: #fff;
}

.chat-header .back {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.18);
}
.chat-header .back:hover {
  background: rgba(255, 255, 255, 0.28);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-area .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.title-area h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.title-area small {
  opacity: 0.85;
  font-size: 12px;
}

.clear-btn {
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
}
.clear-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f7fb;
}

.empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
.empty-title {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 6px;
}
.empty-desc {
  font-size: 13px;
}

.message-row {
  display: flex;
  margin-bottom: 18px;
  align-items: flex-end;
  gap: 10px;
}
.message-row.is-user {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #e9edf7;
  color: #475569;
}
.avatar.user {
  background: #dbeafe;
}

.bubble-wrap {
  max-width: 72%;
  display: flex;
  flex-direction: column;
}
.message-row.is-user .bubble-wrap {
  align-items: flex-end;
}

.bubble {
  padding: 10px 14px;
  border-radius: 14px;
  line-height: 1.65;
  font-size: 15px;
  word-break: break-word;
}
.bubble.ai {
  background: #fff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}
.bubble.user {
  background: linear-gradient(135deg, #7ea2ff 0%, #8c7aff 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.bubble-text {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

/* 打字光标：流式进行中一闪一闪 */
.caret {
  display: inline-block;
  margin-left: 2px;
  color: #94a3b8;
  font-weight: 300;
  animation: caret-blink 1s steps(2, start) infinite;
}
@keyframes caret-blink {
  to { visibility: hidden; }
}

.typing-dots {
  display: inline-flex;
  gap: 4px;
}
.typing-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: blink 1.2s infinite both;
}
.typing-dots i:nth-child(2) { animation-delay: 0.15s; }
.typing-dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes blink {
  0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

.meta {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 14px 20px;
  background: #fff;
  border-top: 1px solid #eef1f6;
}
.input {
  flex: 1;
  resize: none;
  min-height: 44px;
  max-height: 160px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  outline: none;
  font-size: 15px;
  line-height: 1.6;
  font-family: inherit;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: #8faaff;
}

.send {
  height: 44px;
  min-width: 96px;
  border-radius: 12px;
  border: none;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  transition: opacity 0.2s, transform 0.2s;
}
.send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.send:not(:disabled):hover {
  transform: translateY(-1px);
}
</style>
