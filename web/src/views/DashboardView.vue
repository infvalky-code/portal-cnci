<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'
import { listarPeriodos } from '@/services/periods'
import { listarGrupos } from '@/services/groups'
import { listarDocentes } from '@/services/teachers'
import { listarMaterias } from '@/services/subjects'
import { listarAulas } from '@/services/classrooms'
import { listarDispositivos } from '@/services/devices'
import { listarAsistenciaDocentes } from '@/services/teacherAttendance'
import { obtenerAsistenciaGrupo } from '@/services/attendance'
import { listarHorarios } from '@/services/schedules'

const session = useSessionStore()
const esCoordinacion = computed(() => ['Administrador', 'Control escolar'].includes(session.rol))

const DIAS_POR_INDICE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
function fechaDeHoy() {
  return new Date().toISOString().slice(0, 10)
}
function diaDeHoy() {
  return DIAS_POR_INDICE[new Date().getDay()]
}

const cargando = ref(true)
const mensajeError = ref('')

// Coordinación
const docentesSinChecar = ref([])
const resumenAsistencia = ref({ Presente: 0, Ausente: 0, Retardo: 0, Justificada: 0 })
const dispositivos = ref([])

async function cargarCoordinacion() {
  const periodos = await listarPeriodos({ pagina: 1, tamanoPagina: 100, estatus: 'Abierto' })
  const periodoAbierto = periodos.datos[0]
  const [docentes, dispositivosResp] = await Promise.all([
    listarDocentes({ pagina: 1, tamanoPagina: 100 }),
    listarDispositivos({ pagina: 1, tamanoPagina: 100 })
  ])
  dispositivos.value = dispositivosResp.datos

  if (periodoAbierto) {
    const asistenciaHoy = await listarAsistenciaDocentes({
      periodoId: periodoAbierto.id,
      fecha: fechaDeHoy()
    })
    docentesSinChecar.value = asistenciaHoy
      .filter((a) => a.estado === 'Falta')
      .map((a) => docentes.datos.find((d) => d.id === a.docenteId)?.nombre ?? a.docenteId)

    const grupos = await listarGrupos({ pagina: 1, tamanoPagina: 100 })
    const resumen = { Presente: 0, Ausente: 0, Retardo: 0, Justificada: 0 }
    for (const grupo of grupos.datos) {
      const asistencia = await obtenerAsistenciaGrupo(grupo.id, fechaDeHoy())
      for (const registro of asistencia.registros) {
        resumen[registro.estado] = (resumen[registro.estado] ?? 0) + 1
      }
    }
    resumenAsistencia.value = resumen
  }
}

// Docente
const docentes = ref([])
const filtroDocenteId = ref(null)
const clasesDeHoy = ref([])
const seConsultoClases = ref(false)

async function consultarClasesDeHoy() {
  if (!filtroDocenteId.value) return
  cargando.value = true
  try {
    const periodos = await listarPeriodos({ pagina: 1, tamanoPagina: 100, estatus: 'Abierto' })
    const periodoAbierto = periodos.datos[0]
    if (!periodoAbierto) {
      clasesDeHoy.value = []
      seConsultoClases.value = true
      return
    }
    const [bloques, grupos, materias, aulas] = await Promise.all([
      listarHorarios(periodoAbierto.id),
      listarGrupos({ pagina: 1, tamanoPagina: 100 }),
      listarMaterias({ pagina: 1, tamanoPagina: 100 }),
      listarAulas({ pagina: 1, tamanoPagina: 100 })
    ])
    const dia = diaDeHoy()
    clasesDeHoy.value = bloques
      .filter((b) => b.docenteId === filtroDocenteId.value && b.dia === dia)
      .map((b) => ({
        grupo: grupos.datos.find((g) => g.id === b.grupoId)?.nombre ?? b.grupoId,
        materia: materias.datos.find((m) => m.id === b.materiaId)?.nombre ?? b.materiaId,
        aula: aulas.datos.find((a) => a.id === b.aulaId)?.clave ?? b.aulaId
      }))
    seConsultoClases.value = true
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  mensajeError.value = ''
  try {
    if (esCoordinacion.value) {
      await cargarCoordinacion()
    } else {
      docentes.value = (await listarDocentes({ pagina: 1, tamanoPagina: 100 })).datos
    }
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Portal CNCI</h1>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mb-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" />

    <template v-else-if="esCoordinacion">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-card class="pa-4" title="Docentes que no han checado hoy">
            <p v-if="docentesSinChecar.length === 0" class="text-medium-emphasis">
              Nadie pendiente, o no hay periodo abierto.
            </p>
            <v-list v-else density="compact">
              <v-list-item v-for="nombre in docentesSinChecar" :key="nombre" :title="nombre" />
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="pa-4" title="Asistencia de alumnos hoy">
            <v-list density="compact">
              <v-list-item>
                <v-chip color="success" size="small" class="mr-2">Presente</v-chip>
                {{ resumenAsistencia.Presente }}
              </v-list-item>
              <v-list-item>
                <v-chip color="error" size="small" class="mr-2">Ausente</v-chip>
                {{ resumenAsistencia.Ausente }}
              </v-list-item>
              <v-list-item>
                <v-chip color="warning" size="small" class="mr-2">Retardo</v-chip>
                {{ resumenAsistencia.Retardo }}
              </v-list-item>
              <v-list-item>
                <v-chip size="small" class="mr-2">Justificada</v-chip>
                {{ resumenAsistencia.Justificada }}
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="pa-4" title="Dispositivos">
            <v-list density="compact">
              <v-list-item v-for="dispositivo in dispositivos" :key="dispositivo.id">
                <v-chip :color="dispositivo.enLinea ? 'success' : 'error'" size="small" class="mr-2">
                  {{ dispositivo.enLinea ? 'En línea' : 'Sin conexión' }}
                </v-chip>
                {{ dispositivo.nombre }}
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <p class="text-caption text-medium-emphasis mb-4">
        El login todavía no está ligado a tu ficha de docente: elígela a mano mientras tanto.
      </p>
      <v-row class="align-center" dense>
        <v-col cols="12" sm="4">
          <v-select
            v-model="filtroDocenteId"
            label="Tu ficha de docente"
            item-title="nombre"
            item-value="id"
            :items="docentes"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-btn color="primary" variant="outlined" @click="consultarClasesDeHoy">
            Ver mis clases de hoy
          </v-btn>
        </v-col>
      </v-row>

      <p v-if="seConsultoClases && clasesDeHoy.length === 0" class="text-medium-emphasis mt-6">
        No tienes clases hoy según el horario publicado.
      </p>

      <v-table v-else-if="clasesDeHoy.length > 0" class="mt-4">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Materia</th>
            <th>Aula</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(clase, i) in clasesDeHoy" :key="i">
            <td>{{ clase.grupo }}</td>
            <td>{{ clase.materia }}</td>
            <td>{{ clase.aula }}</td>
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-container>
</template>
