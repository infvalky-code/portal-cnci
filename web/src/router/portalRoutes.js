import PlaceholderView from '@/views/PlaceholderView.vue'
import PeriodsView from '@/views/PeriodsView.vue'
import CareersView from '@/views/CareersView.vue'

// Cada pantalla real dentro del layout con sesión agrega meta.roles (quién la
// ve en el menú y quién puede entrar) y, si aparece en el menú lateral,
// meta.menu.titulo. AppLayout.vue lee esta misma lista para armar el menú.
export const rutasDelPortal = [
  { path: '', component: PlaceholderView, meta: { roles: ['Administrador', 'Docente', 'Control escolar'] } },
  {
    path: 'catalogos/periodos',
    component: PeriodsView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Periodos' }
    }
  },
  {
    path: 'catalogos/carreras',
    component: CareersView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Carreras' }
    }
  }
]
