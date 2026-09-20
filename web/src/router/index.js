import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import LoginPlaceholderView from '@/views/LoginPlaceholderView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'

// Cada ruta de pantalla real agrega meta.roles (quién la ve en el menú y
// quién puede entrar) y, si aparece en el menú lateral, meta.menu.titulo.
const routes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [{ path: '', component: LoginPlaceholderView }],
    meta: { publica: true }
  },
  {
    path: '/',
    component: AppLayout,
    children: [{ path: '', component: PlaceholderView }],
    meta: { roles: ['Administrador', 'Docente', 'Control escolar'] }
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
  return true
})

export default router
