<script setup>
import { ref, onMounted } from 'vue'
import { listarGrupos } from '@/services/groups'
import { listarAlumnos } from '@/services/students'
import {
  obtenerAsistenciaGrupo,
  guardarAsistenciaGrupo,
  obtenerHistorialAsistenciaAlumno
} from '@/services/attendance'

const ESTADOS = [
  { valor: 'Presente', color: 'success' },
  { valor: 'Ausente', color: 'error' },
  { valor: 'Retardo', color: 'warning' },
  { valor: 'Justificada', color: undefined }
]

function fechaDeHoy() {
  return new Date().toISOString().slice(0, 10)
}

const grupos = ref([])

onMounted(async () => {
  const respuesta = await listarGrupos({ pagina: 1, tamanoPagina: 100 })
  grupos.value = respuesta.datos
})

const filtroGrupoId = ref(null)
const filtroFecha = ref(fechaDeHoy())

const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')
const alumnos = ref([])
const estadoPorAlumno = ref({})

async function consultar() {
  if (!filtroGrupoId.value || !filtroFecha.value) {
    mensajeError.value = 'Elige un grupo y una fecha antes de consultar.'
    return
  }
  cargando.value = true
  mensajeError.value = ''
  try {
    const [respuestaAlumnos, asistenciaExistente] = await Promise.all([
      listarAlumnos({ pagina: 1, tamanoPagina: 100, grupoId: filtroGrupoId.value }),
      obtenerAsistenciaGrupo(filtroGrupoId.value, filtroFecha.value)
    ])
    alumnos.value = respuestaAlumnos.datos

    const registrosExistentes = new Map(
      asistenciaExistente.registros.map((r) => [r.alumnoId, r.estado])
    )
    const estados = {}
    for (const alumno of alumnos.value) {
      estados[alumno.id] = registrosExistentes.get(alumno.id) ?? 'Presente'
    }
    estadoPorAlumno.value = estados
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

function marcarTodosPresente() {
  const estados = {}
  for (const alumno of alumnos.value) {
    estados[alumno.id] = 'Presente'
  }
  estadoPorAlumno.value = estados
}

const guardando = ref(false)
const mensajeGuardado = ref('')

async function guardar() {
  guardando.value = true
  mensajeError.value = ''
  mensajeGuardado.value = ''
  try {
    const registros = alumnos.value.map((alumno) => ({
      alumnoId: alumno.id,
      estado: estadoPorAlumno.value[alumno.id]
    }))
    await guardarAsistenciaGrupo(filtroGrupoId.value, filtroFecha.value, registros)
    mensajeGuardado.value = 'Asistencia guardada.'
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    guardando.value = false
  }
}

const dialogoHistorialAbierto = ref(false)
const cargandoHistorial = ref(false)
const historial = ref([])
const alumnoHistorial = ref(null)

async function verHistorial(alumno) {
  alumnoHistorial.value = alumno
  dialogoHistorialAbierto.value = true
  cargandoHistorial.value = true
  try {
    historial.value = await obtenerHistorialAsistenciaAlumno(alumno.id)
  } finally {
    cargandoHistorial.value = false
  }
}

function colorEstado(estado) {
  return ESTADOS.find((e) => e.valor === estado)?.color
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Pase de lista</h1>
    <p class="text-caption text-medium-emphasis mb-4">
      El grupo se elige a mano: todavía no existe "mis clases de hoy" porque depende de Horarios
      (fase 3, pendiente).
    </p>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroGrupoId"
          label="Grupo"
          item-title="nombre"
          item-value="id"
          :items="grupos"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field v-model="filtroFecha" label="Fecha" type="date" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn color="primary" variant="outlined" block @click="consultar">Consultar</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>
    <v-alert v-if="mensajeGuardado" type="success" density="compact" class="mt-4">
      {{ mensajeGuardado }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige el grupo y la fecha, y presiona "Consultar" para pasar lista.
      </p>

      <p v-else-if="alumnos.length === 0" class="text-medium-emphasis mt-6">
        Este grupo no tiene alumnos inscritos.
      </p>

      <template v-else>
        <div class="d-flex justify-space-between align-center mt-4">
          <v-btn variant="outlined" @click="marcarTodosPresente">Marcar todos presente</v-btn>
          <v-btn color="primary" :loading="guardando" @click="guardar">Guardar asistencia</v-btn>
        </div>

        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Estado</th>
              <th>Historial</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alumno in alumnos" :key="alumno.id">
              <td>{{ alumno.matricula }}</td>
              <td>{{ alumno.nombre }}</td>
              <td>
                <v-btn-toggle v-model="estadoPorAlumno[alumno.id]" mandatory density="compact">
                  <v-btn
                    v-for="estado in ESTADOS"
                    :key="estado.valor"
                    :value="estado.valor"
                    :color="estadoPorAlumno[alumno.id] === estado.valor ? estado.color : undefined"
                    size="small"
                  >
                    {{ estado.valor }}
                  </v-btn>
                </v-btn-toggle>
              </td>
              <td>
                <v-btn size="small" variant="text" @click="verHistorial(alumno)">Ver</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>
    </template>

    <v-dialog v-model="dialogoHistorialAbierto" max-width="480">
      <v-card :title="`Historial — ${alumnoHistorial?.nombre ?? ''}`" class="pa-4">
        <v-progress-linear v-if="cargandoHistorial" indeterminate color="primary" />
        <p v-else-if="historial.length === 0" class="text-medium-emphasis">
          Sin asistencia registrada todavía.
        </p>
        <v-list v-else density="compact">
          <v-list-item v-for="registro in historial" :key="registro.fecha">
            <template #prepend>
              <v-chip :color="colorEstado(registro.estado)" size="small">
                {{ registro.estado }}
              </v-chip>
            </template>
            <v-list-item-title class="ml-2">{{ registro.fecha }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-card-actions class="pl-0">
          <v-spacer />
          <v-btn variant="text" @click="dialogoHistorialAbierto = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
