import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '主页 · DA AI Agent' },
  },
  {
    path: '/love',
    name: 'LoveApp',
    component: () => import('../views/LoveApp.vue'),
    meta: { title: 'AI 恋爱大师' },
  },
  {
    path: '/manus',
    name: 'ManusApp',
    component: () => import('../views/ManusApp.vue'),
    meta: { title: 'AI 超级智能体' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
