<template>
  <ChatRoom
    title="AI 超级智能体 DaManus"
    avatar="🤖"
    theme-color="#6a8bff"
    :chat-id="chatId"
    empty-title="我是超级智能体 DaManus 🤖"
    empty-desc="我能调用各类工具完成复杂任务，比如搜索、生成 PDF、读写文件等"
    :send-fn="handleSend"
    @clear="regenerateChatId"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ChatRoom from '../components/ChatRoom.vue'
import { openSse } from '../api/sse.js'

const chatId = ref('')

function generateChatId() {
  const rand = Math.random().toString(36).slice(2, 10)
  return `manus-${Date.now()}-${rand}`
}

function regenerateChatId() {
  chatId.value = generateChatId()
}

onMounted(() => {
  chatId.value = generateChatId()
})

/**
 * 打开 SSE 连接。
 * 后端：GET /api/ai/manus/chat?message=
 * 说明：该接口本身没有 chatId 参数（每次请求新建一个 DaManus 实例），
 * 这里的 chatId 仅前端用于展示与标识。
 */
function handleSend(message, { onChunk, onDone, onError }) {
  return openSse(
    '/ai/manus/chat',
    { message },
    {
      onMessage: (data) => onChunk(data),
      onError: () => onDone(),
      onDone: () => onDone(),
    }
  )
}
</script>
