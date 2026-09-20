import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import { rutasDelPortal } from './portalRoutes'

const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [{ path: '', component: LoginView }],
    meta: { publica: true }
  },
  {
    path: '/',
    component: AppLayout,
    children: rutasDelPortal
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (!to.meta.publica && !session.estaAutenticado) {
    return '/login'
  }
  if (to.meta.roles && !to.meta.roles.includes(session.rol)) {
    return '/'
  }
  return true
})

export default router
