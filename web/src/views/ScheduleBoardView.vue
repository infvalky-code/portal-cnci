<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarPeriodos } from '@/services/periods'
import { listarGrupos } from '@/services/groups'
import { listarCarreras } from '@/services/careers'
import { listarTurnos } from '@/services/shifts'
import { listarAulas } from '@/services/classrooms'
import { listarMaterias } from '@/services/subjects'
import { listarDocentes } from '@/services/teachers'
import { listarDisponibilidadesPeriodo } from '@/services/availability'
import { listarHorarios, guardarBloqueHorario, obtenerPublicacionHorario, publicarHorario } from '@/services/schedules'

const DIAS_ENTRE_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

const periodosAbiertos = ref([])
const grupos = ref([])
const carreras = ref([])
const turnos = ref([])
const aulas = ref([])
const materias = ref([])
const docentes = ref([])

onMounted(async () => {
  const [rPeriodos, rGrupos, rCarreras, rTurnos, rAulas, rDocentes] = await Promise.all([
    listarPeriodos({ pagina: 1, tamanoPagina: 100, estatus: 'Abierto' }),
    listarGrupos({ pagina: 1, tamanoPagina: 100 }),
    listarCarreras({ pagina: 1, tamanoPagina: 100 }),
    listarTurnos({ pagina: 1, tamanoPagina: 100 }),
    listarAulas({ pagina: 1, tamanoPagina: 100 }),
    listarDocentes({ pagina: 1, tamanoPagina: 100 })
  ])
  periodosAbiertos.value = rPeriodos.datos
  grupos.value = rGrupos.datos
  carreras.value = rCarreras.datos
  turnos.value = rTurnos.datos
  aulas.value = rAulas.datos
  docentes.value = rDocentes.datos
})

function nombreDocente(id) {
  return docentes.value.find((d) => d.id === id)?.nombre ?? id
}

const filtroPeriodoId = ref(null)
const filtroGrupoId = ref(null)

const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')

const grupoActual = ref(null)
const dias = ref([])
const materiasDelGrupo = ref([])
const disponibilidadesPeriodo = ref([])
const bloquesPeriodo = ref([])
const publicado = ref(false)

// dia -> { materiaId, docenteId, aulaId }
const asignaciones = ref({})

async function consultar() {
  if (!filtroPeriodoId.value || !filtroGrupoId.value) {
    mensajeError.value = 'Elige el periodo y el grupo antes de consultar.'
    return
  }
  cargando.value = true
  mensajeError.value = ''
  try {
    const grupo = grupos.value.find((g) => g.id === filtroGrupoId.value)
    grupoActual.value = grupo
    const turno = turnos.value.find((t) => t.id === grupo.turnoId)
    dias.value = turno?.nombre === 'Sabatino' ? ['Sábado'] : DIAS_ENTRE_SEMANA

    const [rMaterias, rDisponibilidades, rBloques, rPublicacion] = await Promise.all([
      listarMaterias({ pagina: 1, tamanoPagina: 100, carreraId: grupo.carreraId }),
      listarDisponibilidadesPeriodo(filtroPeriodoId.value),
      listarHorarios(filtroPeriodoId.value),
      obtenerPublicacionHorario(filtroPeriodoId.value, filtroGrupoId.value)
    ])
    materiasDelGrupo.value = rMaterias.datos
    disponibilidadesPeriodo.value = rDisponibilidades
    bloquesPeriodo.value = rBloques
    publicado.value = rPublicacion.publicado

    const asign = {}
    for (const dia of dias.value) {
      const existente = bloquesPeriodo.value.find(
        (b) => b.grupoId === filtroGrupoId.value && b.dia === dia
      )
      asign[dia] = {
        materiaId: existente?.materiaId ?? null,
        docenteId: existente?.docenteId ?? null,
        aulaId: existente?.aulaId ?? null
      }
    }
    asignaciones.value = asign
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

function docentesSugeridos(dia, materiaId) {
  if (!materiaId || !grupoActual.value) return []
  return disponibilidadesPeriodo.value
    .filter((d) =>
      d.bloques.some(
        (b) => b.turnoId === grupoActual.value.turnoId && b.dia === dia && b.disponible
      ) && d.materiaIds.includes(materiaId)
    )
    .map((d) => d.docenteId)
}

function esSugerido(dia, materiaId, docenteId) {
  return docentesSugeridos(dia, materiaId).includes(docenteId)
}

const guardandoDia = ref(null)
const mensajeErrorPorDia = ref({})

async function guardarDia(dia) {
  guardandoDia.value = dia
  mensajeErrorPorDia.value = { ...mensajeErrorPorDia.value, [dia]: '' }
  try {
    const asign = asignaciones.value[dia]
    await guardarBloqueHorario({
      periodoId: filtroPeriodoId.value,
      grupoId: filtroGrupoId.value,
      turnoId: grupoActual.value.turnoId,
      dia,
      materiaId: asign.materiaId,
      docenteId: asign.docenteId,
      aulaId: asign.aulaId
    })
    bloquesPeriodo.value = await listarHorarios(filtroPeriodoId.value)
  } catch (error) {
    mensajeErrorPorDia.value = { ...mensajeErrorPorDia.value, [dia]: error.message }
  } finally {
    guardandoDia.value = null
  }
}

const publicando = ref(false)

async function publicar() {
  publicando.value = true
  try {
    const resultado = await publicarHorario(filtroPeriodoId.value, filtroGrupoId.value)
    publicado.value = resultado.publicado
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    publicando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Tablero de horarios</h1>
    <p class="text-caption text-medium-emphasis mb-4">
      El sistema sugiere docentes disponibles y avisa empalmes; la decisión final es de
      Coordinación.
    </p>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroPeriodoId"
          label="Periodo"
          item-title="nombre"
          item-value="id"
          :items="periodosAbiertos"
        />
      </v-col>
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
        <v-btn color="primary" variant="outlined" block @click="consultar">Consultar</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <p v-else-if="!seConsulto" class="text-medium-emphasis mt-6">
      Elige el periodo y el grupo, y presiona "Consultar" para armar el horario.
    </p>

    <template v-else>
      <div class="d-flex align-center mt-4">
        <v-chip :color="publicado ? 'success' : undefined" class="mr-4">
          {{ publicado ? 'Publicado' : 'Sin publicar' }}
        </v-chip>
        <v-btn color="primary" variant="outlined" :loading="publicando" @click="publicar">
          Publicar horario
        </v-btn>
      </div>

      <v-card v-for="dia in dias" :key="dia" class="mt-4 pa-4">
        <h2 class="text-subtitle-1 mb-2">{{ dia }}</h2>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-select
              v-model="asignaciones[dia].materiaId"
              label="Materia"
              item-title="nombre"
              item-value="id"
              :items="materiasDelGrupo"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="asignaciones[dia].docenteId"
              label="Docente"
              item-title="nombre"
              item-value="id"
              :items="docentes"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="asignaciones[dia].aulaId"
              label="Aula"
              item-title="clave"
              item-value="id"
              :items="aulas"
            />
          </v-col>
        </v-row>

        <p class="text-caption text-medium-emphasis">
          Docentes disponibles sugeridos:
          {{
            docentesSugeridos(dia, asignaciones[dia].materiaId).length
              ? docentesSugeridos(dia, asignaciones[dia].materiaId).map(nombreDocente).join(', ')
              : 'ninguno declarado disponible para esta materia en este día'
          }}
        </p>

        <v-alert
          v-if="
            asignaciones[dia].docenteId &&
            asignaciones[dia].materiaId &&
            !esSugerido(dia, asignaciones[dia].materiaId, asignaciones[dia].docenteId)
          "
          type="warning"
          density="compact"
          class="mt-2"
        >
          Este docente está fuera de su disponibilidad declarada para este día. Se puede guardar
          igual; solo es aviso.
        </v-alert>

        <v-alert v-if="mensajeErrorPorDia[dia]" type="error" density="compact" class="mt-2">
          {{ mensajeErrorPorDia[dia] }}
        </v-alert>

        <v-btn
          color="primary"
          class="mt-2"
          :loading="guardandoDia === dia"
          @click="guardarDia(dia)"
        >
          Guardar {{ dia }}
        </v-btn>
      </v-card>
    </template>
  </v-container>
</template>
