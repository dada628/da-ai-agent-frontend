/**
 * 把 AI 流式返回的纯文本安全地渲染成带 Markdown 图片/链接的 HTML。
 *
 * 设计目标：
 *   - 不引入新的运行时依赖（不装 marked / dompurify），小而可控；
 *   - 只支持最常用的几种 Markdown：图片、链接、行内代码、粗体；
 *   - 默认全部 HTML 转义，只有白名单语法会被转回可执行标记；
 *   - URL 只允许：/api/... 相对路径、以及 http(s):// 开头的绝对 URL，
 *     其它一律丢弃（防止 javascript:、data: 等注入）。
 *
 * 输入：可能包含 Markdown 图片语法和普通换行的字符串
 * 输出：可直接 v-html 的 HTML 片段
 */

const IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g
const CODE_RE = /`([^`\n]+)`/g
const BOLD_RE = /\*\*([^*\n]+)\*\*/g

/** 占位符，避免先替换的 HTML 又被后续 escape 掉 */
const PLACEHOLDER = (i) => `\u0000__TOKEN_${i}__\u0000`

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** URL 白名单校验 */
function isSafeUrl(url) {
  if (!url) return false
  if (url.startsWith('/')) return true
  return /^https?:\/\//i.test(url)
}

export function renderAiMessage(raw) {
  if (!raw) return ''

  const tokens = []
  const push = (html) => {
    tokens.push(html)
    return PLACEHOLDER(tokens.length - 1)
  }

  // 1. 先把所有要保留成 HTML 的片段抽出来，替换成占位符
  let text = raw

  text = text.replace(IMG_RE, (_, alt, url) => {
    if (!isSafeUrl(url)) return '' // 非法链接直接抛弃
    const safeAlt = escapeHtml(alt || '')
    const safeUrl = escapeHtml(url)
    return push(
      `<img class="chat-img" src="${safeUrl}" alt="${safeAlt}" loading="lazy" referrerpolicy="no-referrer" />`
    )
  })

  text = text.replace(LINK_RE, (m, label, url) => {
    if (!isSafeUrl(url)) return m
    const safeLabel = escapeHtml(label)
    const safeUrl = escapeHtml(url)
    return push(
      `<a class="chat-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`
    )
  })

  text = text.replace(CODE_RE, (_, code) => push(`<code>${escapeHtml(code)}</code>`))
  text = text.replace(BOLD_RE, (_, b) => push(`<strong>${escapeHtml(b)}</strong>`))

  // 2. 剩余普通文本整体转义（占位符是 \u0000 所以不会被影响）
  text = escapeHtml(text)

  // 3. 再把占位符换回真正的 HTML
  text = text.replace(/\u0000__TOKEN_(\d+)__\u0000/g, (_, i) => tokens[Number(i)] ?? '')

  return text
}
