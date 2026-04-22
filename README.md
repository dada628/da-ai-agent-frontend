# DA AI Agent · 前端

Vue3 + Vite + Vue Router + Axios 构建的 AI 助手前端，对接后端 `da-ai-agent` 的两个接口：

- `GET /api/ai/love_app/chat/sse`：AI 恋爱大师（SSE 流式）
- `GET /api/ai/manus/chat`：AI 超级智能体 DaManus（SSE 流式）

## 页面

| 路由 | 说明 |
| ---- | ---- |
| `/` | 主页，切换应用 |
| `/love` | 恋爱大师对话（聊天室，进入自动生成 chatId） |
| `/manus` | 超级智能体对话（聊天室） |

## 启动

```powershell
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173，已通过 vite.config.js 将 /api 代理到 8123）
npm run dev
```

确保后端 `da-ai-agent` 已在 `http://localhost:8123` 运行。

## 目录结构

```
src/
├── api/
│   ├── http.js      # axios 封装
│   └── sse.js       # SSE 封装（基于 EventSource，自动 URL 编码）
├── components/
│   └── ChatRoom.vue # 通用聊天室组件（气泡、流式、清空）
├── router/
│   └── index.js
├── styles/
│   └── global.css
├── views/
│   ├── Home.vue
│   ├── LoveApp.vue
│   └── ManusApp.vue
├── App.vue
└── main.js
```

## 说明

- SSE 使用浏览器原生 `EventSource`；接口返回 `text/event-stream` 时，每条 `data:` 会触发 `onmessage`。
- 发送按钮：`Enter` 发送、`Shift + Enter` 换行。
- 聊天室右上角「清空对话」会关闭当前 SSE 连接并重新生成 chatId。
