<template>
  <div class="manus-layout">
    <ChatRoom
      class="manus-chat"
      title="AI 超级智能体 DaManus"
      avatar="🤖"
      theme-color="#6a8bff"
      :chat-id="chatId"
      structured-stream
      empty-title="我是超级智能体 DaManus 🤖"
      empty-desc="我能调用各类工具完成复杂任务；右侧可查看任务规划与工具卡片"
      :send-fn="handleSend"
      @clear="regenerateChatId"
      @plan-update="onPlanUpdate"
    />
    <aside class="plan-aside">
      <h3>任务规划</h3>
      <p v-if="!planGoal" class="muted">Planner 未启用或尚无计划时，此处为空。</p>
      <template v-else>
        <div class="plan-goal">{{ planGoal }}</div>
        <ul class="subtask-list">
          <li v-for="(s, i) in planSubtasks" :key="s.id || i" :class="'st-' + (s.status || '').toLowerCase()">
            <span class="st-id">{{ s.id }}</span>
            <span class="st-title">{{ s.title }}</span>
            <span class="st-badge">{{ s.statusDisplay || s.status }}</span>
          </li>
        </ul>
        <div v-if="planCriteria.length" class="criteria">
          <div class="criteria-title">成功判据</div>
          <ul>
            <li v-for="(c, i) in planCriteria" :key="i">{{ c }}</li>
          </ul>
        </div>
      </template>
    </aside>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ChatRoom from '../components/ChatRoom.vue'
import { openSse } from '../api/sse.js'

const chatId = ref('')
const planGoal = ref('')
const planSubtasks = ref([])
const planCriteria = ref([])

function generateChatId() {
  const rand = Math.random().toString(36).slice(2, 10)
  return `manus-${Date.now()}-${rand}`
}

function regenerateChatId() {
  chatId.value = generateChatId()
  planGoal.value = ''
  planSubtasks.value = []
  planCriteria.value = []
}

onMounted(() => {
  chatId.value = generateChatId()
})

function onPlanUpdate(payload) {
  if (!payload) {
    return
  }
  planGoal.value = payload.goal || ''
  planSubtasks.value = Array.isArray(payload.subtasks) ? payload.subtasks : []
  planCriteria.value = Array.isArray(payload.successCriteria) ? payload.successCriteria : []
}

/**
 * Manus SSE：命名事件 meta / plan / think / tool_call / tool_result / final
 */
function handleSend(message, handlers) {
  const { onDone, onError, onStructured } = handlers
  const eventTypes = ['meta', 'plan', 'think', 'tool_call', 'tool_result', 'final']
  return openSse(
    '/ai/manus/chat',
    { message, chatId: chatId.value },
    {
      eventTypes,
      onEvent: (type, data) => {
        if (onStructured) onStructured(type, data)
      },
      onError,
      onDone,
    }
  )
}
</script>

<style scoped>
.manus-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  background: #f1f5f9;
}
.manus-chat {
  flex: 1;
  min-width: 0;
  max-width: none;
  margin: 0;
  box-shadow: none;
}
.plan-aside {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  padding: 16px 14px;
  overflow-y: auto;
  font-size: 13px;
  color: #334155;
}
.plan-aside h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}
.muted {
  color: #94a3b8;
  line-height: 1.5;
}
.plan-goal {
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.5;
}
.subtask-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.subtask-list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px;
  align-items: start;
  padding: 8px 6px;
  border-radius: 8px;
  margin-bottom: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.st-id {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #64748b;
}
.st-title {
  line-height: 1.4;
}
.st-badge {
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
}
.st-done {
  border-color: #86efac;
  background: #f0fdf4;
}
.st-in_progress {
  border-color: #93c5fd;
  background: #eff6ff;
}
.criteria {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
}
.criteria-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.criteria ul {
  margin: 0;
  padding-left: 18px;
  color: #475569;
}
</style>
