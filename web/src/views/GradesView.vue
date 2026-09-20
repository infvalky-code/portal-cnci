<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarCalificaciones, guardarCalificaciones } from '@/services/grades'
import { listarAlumnos } from '@/services/students'
import { listarGrupos } from '@/services/groups'
import { listarCarreras } from '@/services/careers'
import { listarMaterias } from '@/services/subjects'
import { listarPeriodos } from '@/services/periods'
import { listarHorarios } from '@/services/schedules'
import { obtenerHistorialAsistenciaAlumno } from '@/services/attendance'
import { PONDERACION_POR_NIVEL, CALIFICACION_MINIMA_APROBATORIA } from '@/config/gradingConfig'

const periodosAbiertos = ref([])
const grupos = ref([])
const carreras = ref([])
const materias = ref([])

onMounted(async () => {
  const [rPeriodos, rGrupos, rCarreras, rMaterias] = await Promise.all([
    listarPeriodos({ pagina: 1, tamanoPagina: 100, estatus: 'Abierto' }),
    listarGrupos({ pagina: 1, tamanoPagina: 100 }),
    listarCarreras({ pagina: 1, tamanoPagina: 100 }),
    listarMaterias({ pagina: 1, tamanoPagina: 100 })
  ])
  periodosAbiertos.value = rPeriodos.datos
  grupos.value = rGrupos.datos
  carreras.value = rCarreras.datos
  materias.value = rMaterias.datos
})

const filtroPeriodoId = ref(null)
const filtroGrupoId = ref(null)
const filtroMateriaId = ref(null)

const materiasDelGrupo = ref([])

async function alCambiarGrupo() {
  filtroMateriaId.value = null
  materiasDelGrupo.value = []
  if (!filtroPeriodoId.value || !filtroGrupoId.value) return
  const bloques = await listarHorarios(filtroPeriodoId.value)
  const idsAsignados = new Set(
    bloques.filter((b) => b.grupoId === filtroGrupoId.value).map((b) => b.materiaId)
  )
  materiasDelGrupo.value = materias.value.filter((m) => idsAsignados.has(m.id))
}

const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')
const filas = ref([])
const ponderacion = ref([15, 25, 25, 35])

async function consultar() {
  if (!filtroPeriodoId.value || !filtroGrupoId.value || !filtroMateriaId.value) {
    mensajeError.value = 'Elige periodo, grupo y materia antes de consultar.'
    return
  }
  cargando.value = true
  mensajeError.value = ''
  try {
    const grupo = grupos.value.find((g) => g.id === filtroGrupoId.value)
    const carrera = carreras.value.find((c) => c.id === grupo.carreraId)
    ponderacion.value = PONDERACION_POR_NIVEL[carrera?.nivel] ?? [15, 25, 25, 35]

    const [respuestaAlumnos, calificaciones] = await Promise.all([
      listarAlumnos({ pagina: 1, tamanoPagina: 100, grupoId: filtroGrupoId.value }),
      listarCalificaciones(filtroGrupoId.value, filtroMateriaId.value)
    ])

    filas.value = await Promise.all(
      respuestaAlumnos.datos.map(async (alumno) => {
        const existente = calificaciones.find((c) => c.alumnoId === alumno.id)
        const historial = await obtenerHistorialAsistenciaAlumno(alumno.id)
        const faltas = historial.filter(
          (h) => h.grupoId === filtroGrupoId.value && h.estado === 'Ausente'
        ).length
        return {
          alumnoId: alumno.id,
          nombre: alumno.nombre,
          matricula: alumno.matricula,
          parciales: existente?.parciales ?? [null, null, null, null],
          faltas
        }
      })
    )
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

function final(fila) {
  if (fila.parciales.some((p) => p === null || p === undefined)) return null
  return fila.parciales.reduce((suma, p, i) => suma + (p * ponderacion.value[i]) / 100, 0)
}

const guardando = ref(false)
const mensajeGuardado = ref('')

async function guardar() {
  guardando.value = true
  mensajeError.value = ''
  mensajeGuardado.value = ''
  try {
    await guardarCalificaciones(
      filtroGrupoId.value,
      filtroMateriaId.value,
      filas.value.map((f) => ({ alumnoId: f.alumnoId, parciales: f.parciales }))
    )
    mensajeGuardado.value = 'Calificaciones guardadas.'
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Calificaciones</h1>
    <p class="text-caption text-medium-emphasis mb-4">
      Las faltas mostradas son el total de "Ausente" del pase de lista para este grupo; todavía no
      están segmentadas por materia (el pase de lista es por grupo y día, no por clase).
    </p>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroPeriodoId"
          label="Periodo"
          item-title="nombre"
          item-value="id"
          :items="periodosAbiertos"
          @update:model-value="alCambiarGrupo"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroGrupoId"
          label="Grupo"
          item-title="nombre"
          item-value="id"
          :items="grupos"
          @update:model-value="alCambiarGrupo"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroMateriaId"
          label="Materia"
          item-title="nombre"
          item-value="id"
          :items="materiasDelGrupo"
        />
      </v-col>
      <v-col cols="12" sm="3">
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
        Elige periodo, grupo y materia, y presiona "Consultar".
      </p>

      <p v-else-if="filas.length === 0" class="text-medium-emphasis mt-6">
        Este grupo no tiene alumnos inscritos.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th v-for="(peso, i) in ponderacion" :key="i">{{ i + 1 }}° parcial ({{ peso }}%)</th>
              <th>Faltas</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in filas" :key="fila.alumnoId">
              <td>{{ fila.matricula }}</td>
              <td>{{ fila.nombre }}</td>
              <td v-for="(_, i) in ponderacion" :key="i" style="min-width: 90px">
                <v-text-field
                  v-model.number="fila.parciales[i]"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  density="compact"
                  hide-details
                />
              </td>
              <td>{{ fila.faltas }}</td>
              <td>
                <v-chip
                  v-if="final(fila) !== null"
                  :color="final(fila) >= CALIFICACION_MINIMA_APROBATORIA ? 'success' : 'error'"
                >
                  {{ final(fila).toFixed(1) }}
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-btn color="primary" class="mt-4" :loading="guardando" @click="guardar">
          Guardar calificaciones
        </v-btn>
      </template>
    </template>
  </v-container>
</template>
