import PlaceholderView from '@/views/PlaceholderView.vue'
import PeriodsView from '@/views/PeriodsView.vue'
import CareersView from '@/views/CareersView.vue'
import ShiftsView from '@/views/ShiftsView.vue'
import ClassroomsView from '@/views/ClassroomsView.vue'
import SubjectsView from '@/views/SubjectsView.vue'
import GroupsView from '@/views/GroupsView.vue'

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
  },
  {
    path: 'catalogos/turnos',
    component: ShiftsView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Turnos' }
    }
  },
  {
    path: 'catalogos/aulas',
    component: ClassroomsView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Aulas' }
    }
  },
  {
    path: 'catalogos/materias',
    component: SubjectsView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Materias' }
    }
  },
  {
    path: 'catalogos/grupos',
    component: GroupsView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Grupos' }
    }
  }
]
