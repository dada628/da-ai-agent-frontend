/**
 * 创建一个 SSE 连接，支持中文自动 URL 编码。
 *
 * 为什么用原生 EventSource 而不用 axios？
 *   - SSE 本质是一个长连接，服务端不断推送小片段；
 *   - axios 对流式响应支持较弱（浏览器 fetch 流需要手动切 chunk），
 *     而 EventSource 是浏览器原生、专为 SSE 设计，监听 onmessage 即可。
 *
 * 几个稳定性细节：
 *   1. EventSource 在连接关闭后会尝试"自动重连"，这里在结束时显式 close()
 *      并用 finished flag 保证 onDone / onError 只会被回调一次；
 *   2. 服务端正常 complete() 时，浏览器端会触发 onerror（状态=CLOSED），
 *      这是正常现象，不应当作"错误"向调用方报出。
 *
 * @param {string} path    相对后端的接口路径（不含 /api），例如 /ai/love_app/chat/sse
 * @param {object} params  查询参数对象
 * @param {object} handlers { onMessage, onError, onOpen, onDone }
 * @returns {{ close: () => void }}
 */
export function openSse(path, params, handlers = {}) {
  const { onMessage, onError, onOpen, onDone } = handlers

  const qs = new URLSearchParams()
  if (params) {
    Object.keys(params).forEach((k) => {
      const v = params[k]
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
    })
  }

  const url = `/api${path}${qs.toString() ? `?${qs.toString()}` : ''}`
  const es = new EventSource(url, { withCredentials: true })

  let finished = false
  const finish = (err) => {
    if (finished) return
    finished = true
    try {
      es.close()
    } catch (e) {
      /* noop */
    }
    if (err && onError) onError(err)
    if (onDone) onDone()
  }

  if (onOpen) es.onopen = onOpen

  es.onmessage = (ev) => {
    if (finished) return
    if (onMessage) onMessage(ev.data, ev)
  }

  es.onerror = (ev) => {
    if (finished) return
    // Spring 的 SseEmitter.complete() 会断开连接，浏览器端表现为 error
    // 这里根据 readyState 判断："已关闭"视为正常结束；"连接中"是我们不想要的重连
    if (es.readyState === EventSource.CLOSED || es.readyState === EventSource.CONNECTING) {
      finish() // 正常结束或尝试重连，都直接终止
    } else {
      finish(ev) // 其他情况按错误处理
    }
  }

  return {
    close: () => finish(),
  }
}
