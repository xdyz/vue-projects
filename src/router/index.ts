import { createRouter, createWebHistory, RouteLocationNormalized } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { getCookie } from '~/utils/cookie'

// 1. 公开路由列表（仅这些路由允许未登录访问）
const publicRoutes = ['/login', '/signup', '/callback', '/titlebar']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL + 'drive'), // 前缀 /drive
  routes,
})

// 全局前置守卫：严格控制未登录状态
router.beforeEach((to: RouteLocationNormalized, from, next) => {
  const currentPath = to.path // 原始路径（如 /login、/nav/2，不含 /drive 前缀）
  const isPublicRoute = publicRoutes.includes(currentPath) // 判断是否是公开路由

  // 2. 读取 Token（空 Token 直接视为未登录）
  const token = getCookie('authToken') || import.meta.env.VITE_PUBLIC_TOKEN || ''
  // 登录页原始路径（结合 base 自动拼接为 /drive/login）
  const loginRoute = { path: '/login', query: { redirect: currentPath } }

  // 3. 核心逻辑：未登录状态拦截（优先级最高）
  const isLoggedIn = !!token && token.split('.').length === 3 // Token 存在且格式合法
  if (!isLoggedIn) {
    if (isPublicRoute) {
      // 未登录 + 访问公开路由 → 仅允许进入登录页，其他公开路由按需调整
      // （如果只想让未登录用户访问登录页，可改为：if (currentPath === '/login') next() else next(loginRoute)）
      next()
    } else {
      // 未登录 + 访问受保护路由 → 强制跳登录页（阻断所有其他跳转）
      next(loginRoute)
    }
    return // 必须 return，阻断后续逻辑执行
  }

  // 4. 已登录状态：解析 Token 校验有效性
  try {
    const [, payloadBase64] = token.split('.')
    const safePayload = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = safePayload.padEnd(
      safePayload.length + (4 - safePayload.length % 4) % 4,
      '='
    )
    const session = JSON.parse(atob(paddedPayload))
    const isTokenValid = session?.sub && session?.exp >= Date.now() / 1000 // 有用户ID + 未过期

    if (!isTokenValid) {
      // Token 无效（过期/无用户ID）→ 跳登录页
      next(loginRoute)
      return
    }

    // 已登录 + 访问登录页 → 跳回调地址/默认主页（避免重复登录）
    if (currentPath === '/login' && to.query.action !== 'authorize') {
      const redirectPath = to.query.redirect as string || '/recent'
      next(redirectPath)
      return
    }

    // 已登录 + 访问受保护路由 → 放行
    next()
  } catch (error) {
    console.error('Token 解析异常（已登录但内容无效）：', error)
    // Token 格式合法但解析失败 → 视为未登录，跳登录页
    next(loginRoute)
  }
})

export default router