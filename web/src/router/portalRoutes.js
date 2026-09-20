import DashboardView from '@/views/DashboardView.vue'
import PeriodsView from '@/views/PeriodsView.vue'
import CareersView from '@/views/CareersView.vue'
import ShiftsView from '@/views/ShiftsView.vue'
import ClassroomsView from '@/views/ClassroomsView.vue'
import SubjectsView from '@/views/SubjectsView.vue'
import GroupsView from '@/views/GroupsView.vue'
import StudentsView from '@/views/StudentsView.vue'
import TeachersView from '@/views/TeachersView.vue'
import AttendanceView from '@/views/AttendanceView.vue'
import AvailabilityView from '@/views/AvailabilityView.vue'
import ScheduleBoardView from '@/views/ScheduleBoardView.vue'
import TeacherAttendanceView from '@/views/TeacherAttendanceView.vue'
import DevicesView from '@/views/DevicesView.vue'
import GradesView from '@/views/GradesView.vue'
import PeriodClosingView from '@/views/PeriodClosingView.vue'
import ReportsView from '@/views/ReportsView.vue'

// Cada pantalla real dentro del layout con sesión agrega meta.roles (quién la
// ve en el menú y quién puede entrar) y, si aparece en el menú lateral,
// meta.menu.titulo. AppLayout.vue lee esta misma lista para armar el menú.
export const rutasDelPortal = [
  { path: '', component: DashboardView, meta: { roles: ['Administrador', 'Docente', 'Control escolar'] } },
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
  },
  {
    path: 'alumnos',
    component: StudentsView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Alumnos' }
    }
  },
  {
    path: 'docentes',
    component: TeachersView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Docentes' }
    }
  },
  {
    path: 'pase-de-lista',
    component: AttendanceView,
    meta: {
      roles: ['Docente'],
      menu: { titulo: 'Pase de lista' }
    }
  },
  {
    path: 'disponibilidad',
    component: AvailabilityView,
    meta: {
      roles: ['Docente'],
      menu: { titulo: 'Disponibilidad' }
    }
  },
  {
    path: 'horarios',
    component: ScheduleBoardView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Horarios' }
    }
  },
  {
    path: 'asistencia-docentes',
    component: TeacherAttendanceView,
    meta: {
      roles: ['Administrador', 'Control escolar'],
      menu: { titulo: 'Asistencia de docentes' }
    }
  },
  {
    path: 'dispositivos',
    component: DevicesView,
    meta: {
      roles: ['Administrador'],
      menu: { titulo: 'Dispositivos' }
    }
  },
  {
    path: 'calificaciones',
    component: GradesView,
    meta: {
      roles: ['Docente', 'Control escolar'],
      menu: { titulo: 'Calificaciones' }
    }
  },
  {
    path: 'cierre-tetramestre',
    component: PeriodClosingView,
    meta: {
      roles: ['Control escolar'],
      menu: { titulo: 'Cierre de tetramestre' }
    }
  },
  {
    path: 'reportes',
    component: ReportsView,
    meta: {
      roles: ['Administrador', 'Control escolar', 'Docente'],
      menu: { titulo: 'Reportes' }
    }
  }
]
