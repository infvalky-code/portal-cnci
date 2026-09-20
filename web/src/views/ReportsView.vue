<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarPeriodos } from '@/services/periods'
import { listarGrupos } from '@/services/groups'
import { listarCarreras } from '@/services/careers'
import { listarMaterias } from '@/services/subjects'
import { listarAlumnos } from '@/services/students'
import { listarCalificaciones } from '@/services/grades'
import { obtenerAsistenciaGrupo, obtenerHistorialAsistenciaAlumno } from '@/services/attendance'
import { listarHorarios } from '@/services/schedules'
import { PONDERACION_POR_NIVEL, CALIFICACION_MINIMA_APROBATORIA } from '@/config/gradingConfig'
import { exportarExcel, imprimir } from '@/services/exportHelpers'

const FORMATOS = [
  { valor: 'lista-mensual', titulo: 'Lista de alumnos mensual' },
  { valor: 'acta-bachillerato', titulo: 'Acta de calificaciones, bachillerato' },
  { valor: 'boleta', titulo: 'Boleta de calificaciones' },
  { valor: 'acta-licenciatura', titulo: 'Acta de evaluación, licenciatura' }
]

const ABREVIATURA_ESTADO = { Presente: 'P', Ausente: 'F', Retardo: 'R', Justificada: 'J' }

const formato = ref('lista-mensual')

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

async function materiasDeGrupo(grupoId, periodoId) {
  const bloques = await listarHorarios(periodoId)
  const ids = new Set(bloques.filter((b) => b.grupoId === grupoId).map((b) => b.materiaId))
  return materias.value.filter((m) => ids.has(m.id))
}

async function gruposDeMateria(materiaId, periodoId) {
  const bloques = await listarHorarios(periodoId)
  const ids = new Set(bloques.filter((b) => b.materiaId === materiaId).map((b) => b.grupoId))
  return grupos.value.filter((g) => ids.has(g.id))
}

function ponderacionDeGrupo(grupoId) {
  const grupo = grupos.value.find((g) => g.id === grupoId)
  const carrera = carreras.value.find((c) => c.id === grupo?.carreraId)
  return PONDERACION_POR_NIVEL[carrera?.nivel] ?? [15, 25, 25, 35]
}

// --- Filtros ---
const filtroPeriodoId = ref(null)
const filtroGrupoId = ref(null)
const filtroMateriaId = ref(null)
const filtroAlumnoId = ref(null)
const filtroParcial = ref(1)
const filtroMes = ref(new Date().toISOString().slice(0, 7))

const materiasDelGrupo = ref([])
const gruposDeLaMateria = ref([])
const alumnosDisponibles = ref([])

async function alCambiarGrupo() {
  filtroMateriaId.value = null
  materiasDelGrupo.value = []
  if (!filtroPeriodoId.value || !filtroGrupoId.value) return
  materiasDelGrupo.value = await materiasDeGrupo(filtroGrupoId.value, filtroPeriodoId.value)
}

async function alCambiarMateria() {
  gruposDeLaMateria.value = []
  if (!filtroPeriodoId.value || !filtroMateriaId.value) return
  gruposDeLaMateria.value = await gruposDeMateria(filtroMateriaId.value, filtroPeriodoId.value)
}

onMounted(async () => {
  const respuesta = await listarAlumnos({ pagina: 1, tamanoPagina: 200 })
  alumnosDisponibles.value = respuesta.datos
})

// --- Resultado ---
const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')
const columnas = ref([])
const filas = ref([])
const indiceReprobacion = ref(null)

async function consultarListaMensual() {
  if (!filtroPeriodoId.value || !filtroGrupoId.value || !filtroMes.value) {
    throw new Error('Elige periodo, grupo y mes.')
  }
  const [anio, mes] = filtroMes.value.split('-').map(Number)
  const diasEnMes = new Date(anio, mes, 0).getDate()
  const grupo = grupos.value.find((g) => g.id === filtroGrupoId.value)
  const carrera = carreras.value.find((c) => c.id === grupo.carreraId)

  const respuestaAlumnos = await listarAlumnos({
    pagina: 1,
    tamanoPagina: 100,
    grupoId: filtroGrupoId.value
  })

  const porDia = {}
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const asistencia = await obtenerAsistenciaGrupo(filtroGrupoId.value, fecha)
    porDia[dia] = new Map(asistencia.registros.map((r) => [r.alumnoId, r.estado]))
  }

  columnas.value = [
    { key: 'carrera', titulo: 'Carrera' },
    { key: 'matricula', titulo: 'Matrícula' },
    { key: 'nombre', titulo: 'Alumno' },
    ...Array.from({ length: diasEnMes }, (_, i) => ({ key: `dia${i + 1}`, titulo: String(i + 1) }))
  ]
  filas.value = respuestaAlumnos.datos.map((alumno) => {
    const fila = { carrera: carrera?.nombre ?? '', matricula: alumno.matricula, nombre: alumno.nombre }
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const estado = porDia[dia].get(alumno.id)
      fila[`dia${dia}`] = estado ? ABREVIATURA_ESTADO[estado] : ''
    }
    return fila
  })
  indiceReprobacion.value = null
}

async function consultarActaBachillerato() {
  if (!filtroPeriodoId.value || !filtroGrupoId.value) {
    throw new Error('Elige periodo y grupo.')
  }
  const ponderacion = ponderacionDeGrupo(filtroGrupoId.value)
  const materiasAsignadas = await materiasDeGrupo(filtroGrupoId.value, filtroPeriodoId.value)
  const respuestaAlumnos = await listarAlumnos({
    pagina: 1,
    tamanoPagina: 100,
    grupoId: filtroGrupoId.value
  })

  const calificacionesPorMateria = {}
  for (const materia of materiasAsignadas) {
    calificacionesPorMateria[materia.id] = await listarCalificaciones(filtroGrupoId.value, materia.id)
  }

  columnas.value = [
    { key: 'matricula', titulo: 'Matrícula' },
    { key: 'nombre', titulo: 'Alumno' },
    ...materiasAsignadas.flatMap((m) => [
      { key: `cal-${m.id}`, titulo: `${m.nombre} · parcial ${filtroParcial.value}` },
      { key: `faltas-${m.id}`, titulo: `${m.nombre} · faltas` }
    ])
  ]

  let reprobadosParcial = 0
  let capturados = 0

  filas.value = []
  for (const alumno of respuestaAlumnos.datos) {
    const historial = await obtenerHistorialAsistenciaAlumno(alumno.id)
    const faltasTotales = historial.filter(
      (h) => h.grupoId === filtroGrupoId.value && h.estado === 'Ausente'
    ).length

    const fila = { matricula: alumno.matricula, nombre: alumno.nombre }
    for (const materia of materiasAsignadas) {
      const registro = calificacionesPorMateria[materia.id].find((c) => c.alumnoId === alumno.id)
      const calificacion = registro?.parciales?.[filtroParcial.value - 1] ?? null
      fila[`cal-${materia.id}`] = calificacion ?? ''
      fila[`faltas-${materia.id}`] = faltasTotales
      if (calificacion !== null) {
        capturados++
        if (calificacion < CALIFICACION_MINIMA_APROBATORIA) reprobadosParcial++
      }
    }
    filas.value.push(fila)
  }
  indiceReprobacion.value = capturados > 0 ? (reprobadosParcial / capturados) * 100 : null
}

async function consultarBoleta() {
  if (!filtroPeriodoId.value || !filtroAlumnoId.value) {
    throw new Error('Elige periodo y alumno.')
  }
  const alumno = alumnosDisponibles.value.find((a) => a.id === filtroAlumnoId.value)
  if (!alumno.grupoId) {
    throw new Error('Este alumno no tiene grupo asignado.')
  }
  const ponderacion = ponderacionDeGrupo(alumno.grupoId)
  const materiasAsignadas = await materiasDeGrupo(alumno.grupoId, filtroPeriodoId.value)
  const historial = await obtenerHistorialAsistenciaAlumno(alumno.id)
  const faltasTotales = historial.filter(
    (h) => h.grupoId === alumno.grupoId && h.estado === 'Ausente'
  ).length

  columnas.value = [
    { key: 'materia', titulo: 'Materia' },
    { key: 'p1', titulo: '1er parcial' },
    { key: 'p2', titulo: '2do parcial' },
    { key: 'p3', titulo: '3er parcial' },
    { key: 'p4', titulo: '4to parcial' },
    { key: 'faltas', titulo: 'Faltas' },
    { key: 'final', titulo: 'Final' }
  ]

  filas.value = []
  for (const materia of materiasAsignadas) {
    const calificaciones = await listarCalificaciones(alumno.grupoId, materia.id)
    const registro = calificaciones.find((c) => c.alumnoId === alumno.id)
    const parciales = registro?.parciales ?? [null, null, null, null]
    const completo = parciales.every((p) => p !== null && p !== undefined)
    const final = completo
      ? parciales.reduce((s, p, i) => s + (p * ponderacion[i]) / 100, 0).toFixed(1)
      : ''
    filas.value.push({
      materia: materia.nombre,
      p1: parciales[0] ?? '',
      p2: parciales[1] ?? '',
      p3: parciales[2] ?? '',
      p4: parciales[3] ?? '',
      faltas: faltasTotales,
      final
    })
  }
  indiceReprobacion.value = null
}

async function consultarActaLicenciatura() {
  if (!filtroPeriodoId.value || !filtroMateriaId.value) {
    throw new Error('Elige periodo y materia.')
  }
  const gruposDeEsaMateria = await gruposDeMateria(filtroMateriaId.value, filtroPeriodoId.value)

  columnas.value = [
    { key: 'matricula', titulo: 'Matrícula' },
    { key: 'nombre', titulo: 'Alumno' },
    { key: 'p1', titulo: '1er parcial (15%)' },
    { key: 'p2', titulo: '2do parcial (25%)' },
    { key: 'p3', titulo: '3er parcial (25%)' },
    { key: 'p4', titulo: '4to parcial (35%)' },
    { key: 'faltas', titulo: 'Total de faltas' },
    { key: 'final', titulo: 'Calificación final' }
  ]

  filas.value = []
  for (const grupo of gruposDeEsaMateria) {
    const ponderacion = ponderacionDeGrupo(grupo.id)
    const respuestaAlumnos = await listarAlumnos({ pagina: 1, tamanoPagina: 100, grupoId: grupo.id })
    const calificaciones = await listarCalificaciones(grupo.id, filtroMateriaId.value)
    for (const alumno of respuestaAlumnos.datos) {
      const historial = await obtenerHistorialAsistenciaAlumno(alumno.id)
      const faltasTotales = historial.filter(
        (h) => h.grupoId === grupo.id && h.estado === 'Ausente'
      ).length
      const registro = calificaciones.find((c) => c.alumnoId === alumno.id)
      const parciales = registro?.parciales ?? [null, null, null, null]
      const completo = parciales.every((p) => p !== null && p !== undefined)
      const final = completo
        ? parciales.reduce((s, p, i) => s + (p * ponderacion[i]) / 100, 0)
        : null
      filas.value.push({
        matricula: alumno.matricula,
        nombre: alumno.nombre,
        p1: parciales[0] ?? '',
        p2: parciales[1] ?? '',
        p3: parciales[2] ?? '',
        p4: parciales[3] ?? '',
        faltas: faltasTotales,
        final: final !== null ? final.toFixed(1) : ''
      })
    }
  }
  indiceReprobacion.value = null
}

async function consultar() {
  cargando.value = true
  mensajeError.value = ''
  seConsulto.value = false
  columnas.value = []
  filas.value = []
  try {
    if (formato.value === 'lista-mensual') await consultarListaMensual()
    else if (formato.value === 'acta-bachillerato') await consultarActaBachillerato()
    else if (formato.value === 'boleta') await consultarBoleta()
    else if (formato.value === 'acta-licenciatura') await consultarActaLicenciatura()
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

function exportar() {
  const filasPlanas = filas.value.map((fila) => {
    const plano = {}
    for (const columna of columnas.value) {
      plano[columna.titulo] = fila[columna.key]
    }
    return plano
  })
  exportarExcel(formato.value, filasPlanas)
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4 no-imprimir">Reportes</h1>

    <v-row class="align-center no-imprimir" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="formato"
          label="Formato"
          item-title="titulo"
          item-value="valor"
          :items="FORMATOS"
          @update:model-value="seConsulto = false"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroPeriodoId"
          label="Periodo"
          item-title="nombre"
          item-value="id"
          :items="periodosAbiertos"
        />
      </v-col>
    </v-row>

    <v-row v-if="formato === 'lista-mensual'" class="align-center no-imprimir" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroGrupoId"
          label="Grupo"
          item-title="nombre"
          item-value="id"
          :items="grupos"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filtroMes" label="Mes" type="month" />
      </v-col>
    </v-row>

    <v-row v-else-if="formato === 'acta-bachillerato'" class="align-center no-imprimir" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroGrupoId"
          label="Grupo"
          item-title="nombre"
          item-value="id"
          :items="grupos"
          @update:model-value="alCambiarGrupo"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroParcial"
          label="Parcial"
          :items="[1, 2, 3, 4]"
        />
      </v-col>
    </v-row>

    <v-row v-else-if="formato === 'boleta'" class="align-center no-imprimir" dense>
      <v-col cols="12" sm="6">
        <v-select
          v-model="filtroAlumnoId"
          label="Alumno"
          item-title="nombre"
          item-value="id"
          :items="alumnosDisponibles"
        />
      </v-col>
    </v-row>

    <v-row v-else-if="formato === 'acta-licenciatura'" class="align-center no-imprimir" dense>
      <v-col cols="12" sm="6">
        <v-select
          v-model="filtroMateriaId"
          label="Materia"
          item-title="nombre"
          item-value="id"
          :items="materias"
        />
      </v-col>
    </v-row>

    <v-btn color="primary" variant="outlined" class="no-imprimir" @click="consultar">
      Consultar
    </v-btn>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4 no-imprimir">
      {{ mensajeError }}
    </v-alert>

    <v-alert
      v-if="formato === 'boleta'"
      type="warning"
      density="compact"
      class="mt-4 no-imprimir"
    >
      Observaciones del tutor: pendiente — no hay pantalla de captura para eso todavía.
    </v-alert>
    <v-alert
      v-if="formato === 'lista-mensual'"
      type="warning"
      density="compact"
      class="mt-4 no-imprimir"
    >
      P = presente, F = falta, R = retardo, J = justificada. El formato oficial de Coordinación
      solo tiene punto y diagonal; cómo imprimir retardo/justificada sigue sin confirmarse.
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4 no-imprimir" />

    <template v-else-if="seConsulto">
      <v-alert
        v-if="indiceReprobacion !== null"
        :type="indiceReprobacion > 5 ? 'error' : 'success'"
        density="compact"
        class="mt-4 no-imprimir"
      >
        Índice de reprobación de este parcial: {{ indiceReprobacion.toFixed(1) }}%
        {{ indiceReprobacion > 5 ? '(por encima del 5%)' : '' }}
      </v-alert>

      <div class="d-flex mt-4 no-imprimir">
        <v-btn variant="outlined" class="mr-2" @click="exportar">Exportar a Excel</v-btn>
        <v-btn variant="outlined" @click="imprimir">Imprimir / Guardar como PDF</v-btn>
      </div>

      <p v-if="filas.length === 0" class="text-medium-emphasis mt-6">Sin datos para mostrar.</p>

      <v-table v-else density="compact" class="mt-4">
        <thead>
          <tr>
            <th v-for="columna in columnas" :key="columna.key">{{ columna.titulo }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fila, i) in filas" :key="i">
            <td v-for="columna in columnas" :key="columna.key">{{ fila[columna.key] }}</td>
          </tr>
        </tbody>
      </v-table>
    </template>

    <p v-else class="text-medium-emphasis mt-6 no-imprimir">
      Elige el formato y los filtros, y presiona "Consultar".
    </p>
  </v-container>
</template>

<style>
@media print {
  .v-navigation-drawer,
  .no-imprimir {
    display: none !important;
  }
}
</style>
