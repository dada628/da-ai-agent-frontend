import axios from 'axios'

// 说明：开发环境通过 Vite 代理，/api 自动转到 http://localhost:8123
// 生产环境若直接访问后端，可改成绝对地址或走 Nginx 反代
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('[http error]', err)
    return Promise.reject(err)
  }
)

export default http
