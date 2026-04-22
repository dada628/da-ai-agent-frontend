<template>
  <ChatRoom
    title="AI 恋爱大师"
    avatar="💞"
    theme-color="#ff6aa1"
    :chat-id="chatId"
    empty-title="Hi，我是你的恋爱心理顾问 💞"
    empty-desc="无论是单身、恋爱还是已婚，遇到情感困扰都可以跟我聊聊～"
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
  // 进入页面即生成一个 chatId，用于服务端区分不同会话（带记忆）
  const rand = Math.random().toString(36).slice(2, 10)
  return `love-${Date.now()}-${rand}`
}

function regenerateChatId() {
  chatId.value = generateChatId()
}

onMounted(() => {
  chatId.value = generateChatId()
})

/**
 * 打开 SSE 连接，把 chunk 回填给 ChatRoom 组件
 * 后端：GET /api/ai/love_app/chat/sse?message=&chatId=
 * 返回 text/event-stream
 */
function handleSend(message, { onChunk, onDone, onError }) {
  const es = openSse(
    '/ai/love_app/chat/sse',
    { message, chatId: chatId.value },
    {
      onMessage: (data) => onChunk(data),
      onError: () => {
        // SSE 正常结束时浏览器也会触发 error；这里直接视为完成
        onDone()
      },
      onDone: () => onDone(),
    }
  )
  // 兜底：如果服务端意外长时间不结束，可由调用方 close
  return es
}
</script>
