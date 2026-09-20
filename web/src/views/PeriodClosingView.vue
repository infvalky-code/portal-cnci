<script setup>
import { ref, onMounted } from 'vue'
import { listarPeriodos, cerrarPeriodo } from '@/services/periods'
import { obtenerCierreTetramestre, guardarCierreTetramestre } from '@/services/periodClosing'
import { listarGrupos } from '@/services/groups'
import { listarMaterias } from '@/services/subjects'
import { listarAlumnos } from '@/services/students'
import { listarCalificaciones } from '@/services/grades'
import { listarHorarios } from '@/services/schedules'
import { PONDERACION_POR_NIVEL, CALIFICACION_MINIMA_APROBATORIA } from '@/config/gradingConfig'
import { listarCarreras } from '@/services/careers'

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
const cierre = ref({ periodoId: null, fechaFirmaActa: '', fechaExtraordinario: '', fechaTerceraOportunidad: '' })
const reprobados = ref([])
const periodoActual = ref(null)

async function consultar() {
  if (!filtroPeriodoId.value || !filtroGrupoId.value || !filtroMateriaId.value) {
    mensajeError.value = 'Elige periodo, grupo y materia antes de consultar.'
    return
  }
  cargando.value = true
  mensajeError.value = ''
  try {
    periodoActual.value = periodosAbiertos.value.find((p) => p.id === filtroPeriodoId.value)
    const datosCierre = await obtenerCierreTetramestre(filtroPeriodoId.value)
    cierre.value = {
      periodoId: filtroPeriodoId.value,
      fechaFirmaActa: datosCierre.fechaFirmaActa ?? '',
      fechaExtraordinario: datosCierre.fechaExtraordinario ?? '',
      fechaTerceraOportunidad: datosCierre.fechaTerceraOportunidad ?? ''
    }

    const grupo = grupos.value.find((g) => g.id === filtroGrupoId.value)
    const carrera = carreras.value.find((c) => c.id === grupo.carreraId)
    const ponderacion = PONDERACION_POR_NIVEL[carrera?.nivel] ?? [15, 25, 25, 35]

    const [respuestaAlumnos, calificaciones] = await Promise.all([
      listarAlumnos({ pagina: 1, tamanoPagina: 100, grupoId: filtroGrupoId.value }),
      listarCalificaciones(filtroGrupoId.value, filtroMateriaId.value)
    ])

    reprobados.value = respuestaAlumnos.datos
      .map((alumno) => {
        const registro = calificaciones.find((c) => c.alumnoId === alumno.id)
        if (!registro || registro.parciales.some((p) => p === null || p === undefined)) return null
        const final = registro.parciales.reduce((s, p, i) => s + (p * ponderacion[i]) / 100, 0)
        return { nombre: alumno.nombre, matricula: alumno.matricula, final }
      })
      .filter((r) => r && r.final < CALIFICACION_MINIMA_APROBATORIA)

    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

const guardando = ref(false)
const mensajeGuardado = ref('')

async function guardarFechas() {
  guardando.value = true
  mensajeError.value = ''
  mensajeGuardado.value = ''
  try {
    await guardarCierreTetramestre({
      periodoId: filtroPeriodoId.value,
      fechaFirmaActa: cierre.value.fechaFirmaActa || null,
      fechaExtraordinario: cierre.value.fechaExtraordinario || null,
      fechaTerceraOportunidad: cierre.value.fechaTerceraOportunidad || null
    })
    mensajeGuardado.value = 'Fechas guardadas.'
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    guardando.value = false
  }
}

const cerrando = ref(false)

async function cerrar() {
  cerrando.value = true
  mensajeError.value = ''
  try {
    await cerrarPeriodo(filtroPeriodoId.value)
    periodoActual.value = { ...periodoActual.value, estatus: 'Cerrado' }
    periodosAbiertos.value = periodosAbiertos.value.filter((p) => p.id !== filtroPeriodoId.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cerrando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Cierre de tetramestre</h1>
    <p class="text-caption text-medium-emphasis mb-4">
      El acuse de enterado y la captura de segunda/tercera oportunidad no están aquí: los
      documentos del proyecto no definen esos campos todavía.
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

    <template v-else-if="seConsulto">
      <v-card class="mt-4 pa-4">
        <h2 class="text-subtitle-1 mb-2">Fechas de cierre</h2>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field v-model="cierre.fechaFirmaActa" label="Firma de acta" type="date" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="cierre.fechaExtraordinario"
              label="Extraordinario (2ª oportunidad)"
              type="date"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="cierre.fechaTerceraOportunidad"
              label="3ª oportunidad"
              type="date"
            />
          </v-col>
        </v-row>
        <v-btn color="primary" :loading="guardando" @click="guardarFechas">Guardar fechas</v-btn>
      </v-card>

      <v-card class="mt-4 pa-4">
        <h2 class="text-subtitle-1 mb-2">Reprobados (final &lt; 7.0)</h2>
        <p v-if="reprobados.length === 0" class="text-medium-emphasis">
          Nadie reprobado con calificaciones completas en esta materia.
        </p>
        <v-table v-else density="compact">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alumno in reprobados" :key="alumno.matricula">
              <td>{{ alumno.matricula }}</td>
              <td>{{ alumno.nombre }}</td>
              <td>
                <v-chip color="error" size="small">{{ alumno.final.toFixed(1) }}</v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <v-card class="mt-4 pa-4">
        <h2 class="text-subtitle-1 mb-2">Estatus del periodo</h2>
        <v-chip :color="periodoActual?.estatus === 'Cerrado' ? undefined : 'primary'" class="mr-4">
          {{ periodoActual?.estatus }}
        </v-chip>
        <v-btn
          v-if="periodoActual?.estatus === 'Abierto'"
          color="error"
          :loading="cerrando"
          @click="cerrar"
        >
          Cerrar periodo
        </v-btn>
      </v-card>
    </template>

    <p v-else class="text-medium-emphasis mt-6">
      Elige periodo, grupo y materia, y presiona "Consultar".
    </p>
  </v-container>
</template>
