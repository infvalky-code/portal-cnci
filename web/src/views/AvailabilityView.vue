<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { obtenerDisponibilidad, guardarDisponibilidad } from '@/services/availability'
import { listarPeriodos } from '@/services/periods'
import { listarTurnos } from '@/services/shifts'
import { listarCarreras } from '@/services/careers'
import { listarMaterias } from '@/services/subjects'
import { listarDocentes } from '@/services/teachers'

// Turnos por nivel, documentados en "Formatos institucionales CNCI.docx".
// Sabatino ya implica el sábado, por eso no lleva los 5 días de Lun-Vie.
const TURNOS_POR_NIVEL = {
  Licenciatura: ['Matutino', 'Nocturno', 'Sabatino'],
  Bachillerato: ['Matutino', 'Sabatino']
}
const DIAS_ENTRE_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const NIVELES = ['Licenciatura', 'Bachillerato']

const docentes = ref([])
const periodosAbiertos = ref([])
const turnos = ref([])
const carreras = ref([])
const materias = ref([])

onMounted(async () => {
  const [respuestaDocentes, respuestaPeriodos, respuestaTurnos, respuestaCarreras, respuestaMaterias] =
    await Promise.all([
      listarDocentes({ pagina: 1, tamanoPagina: 100 }),
      listarPeriodos({ pagina: 1, tamanoPagina: 100, estatus: 'Abierto' }),
      listarTurnos({ pagina: 1, tamanoPagina: 100 }),
      listarCarreras({ pagina: 1, tamanoPagina: 100 }),
      listarMaterias({ pagina: 1, tamanoPagina: 100 })
    ])
  docentes.value = respuestaDocentes.datos
  periodosAbiertos.value = respuestaPeriodos.datos
  turnos.value = respuestaTurnos.datos
  carreras.value = respuestaCarreras.datos
  materias.value = respuestaMaterias.datos
})

function idTurno(nombre) {
  return turnos.value.find((t) => t.nombre === nombre)?.id
}

const filtroDocenteId = ref(null)
const filtroPeriodoId = ref(null)

const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')

const especialidadTitulo = ref('')
const nivelesElegidos = ref([])
const materiaIdsElegidas = ref([])
const bloques = reactive({})

function claveBloque(turnoId, dia) {
  return `${turnoId}|${dia}`
}

const filasPorTurno = computed(() => {
  const turnoNombres = new Set()
  for (const nivel of nivelesElegidos.value) {
    for (const nombre of TURNOS_POR_NIVEL[nivel] ?? []) {
      turnoNombres.add(nombre)
    }
  }
  return [...turnoNombres].map((nombreTurno) => {
    const turnoId = idTurno(nombreTurno)
    const dias = nombreTurno === 'Sabatino' ? ['Sábado'] : DIAS_ENTRE_SEMANA
    return { nombreTurno, turnoId, dias }
  })
})

watch(filasPorTurno, (filas) => {
  const clavesValidas = new Set()
  for (const fila of filas) {
    for (const dia of fila.dias) {
      const clave = claveBloque(fila.turnoId, dia)
      clavesValidas.add(clave)
      if (!bloques[clave]) {
        bloques[clave] = { disponible: false, horaEntrada: '', horaSalida: '' }
      }
    }
  }
  for (const clave of Object.keys(bloques)) {
    if (!clavesValidas.has(clave)) {
      delete bloques[clave]
    }
  }
})

const materiasDisponibles = computed(() => {
  const carrerasDeLosNiveles = new Set(
    carreras.value.filter((c) => nivelesElegidos.value.includes(c.nivel)).map((c) => c.id)
  )
  return materias.value.filter((m) => carrerasDeLosNiveles.has(m.carreraId))
})

async function consultar() {
  if (!filtroDocenteId.value || !filtroPeriodoId.value) {
    mensajeError.value = 'Elige tu ficha de docente y el periodo antes de consultar.'
    return
  }
  cargando.value = true
  mensajeError.value = ''
  try {
    const disponibilidad = await obtenerDisponibilidad(filtroDocenteId.value, filtroPeriodoId.value)
    const docente = docentes.value.find((d) => d.id === filtroDocenteId.value)
    especialidadTitulo.value = disponibilidad.especialidadTitulo || docente?.especialidad || ''
    nivelesElegidos.value = disponibilidad.niveles
    materiaIdsElegidas.value = disponibilidad.materiaIds

    for (const clave of Object.keys(bloques)) {
      delete bloques[clave]
    }
    for (const bloque of disponibilidad.bloques) {
      bloques[claveBloque(bloque.turnoId, bloque.dia)] = {
        disponible: bloque.disponible,
        horaEntrada: bloque.horaEntrada ?? '',
        horaSalida: bloque.horaSalida ?? ''
      }
    }
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

const guardando = ref(false)
const mensajeGuardado = ref('')

async function guardar() {
  guardando.value = true
  mensajeError.value = ''
  mensajeGuardado.value = ''
  try {
    const listaBloques = filasPorTurno.value.flatMap((fila) =>
      fila.dias.map((dia) => {
        const valor = bloques[claveBloque(fila.turnoId, dia)]
        return {
          turnoId: fila.turnoId,
          dia,
          disponible: valor.disponible,
          ...(valor.disponible ? { horaEntrada: valor.horaEntrada, horaSalida: valor.horaSalida } : {})
        }
      })
    )
    await guardarDisponibilidad({
      docenteId: filtroDocenteId.value,
      periodoId: filtroPeriodoId.value,
      especialidadTitulo: especialidadTitulo.value,
      niveles: nivelesElegidos.value,
      bloques: listaBloques,
      materiaIds: materiaIdsElegidas.value
    })
    mensajeGuardado.value = 'Disponibilidad guardada.'
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Disponibilidad</h1>
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
        <v-select
          v-model="filtroPeriodoId"
          label="Tetramestre"
          item-title="nombre"
          item-value="id"
          :items="periodosAbiertos"
        />
      </v-col>
      <v-col cols="12" sm="4">
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

    <p v-else-if="!seConsulto" class="text-medium-emphasis mt-6">
      Elige tu ficha y el tetramestre, y presiona "Consultar" para llenar tu disponibilidad.
    </p>

    <template v-else>
      <v-text-field
        v-model="especialidadTitulo"
        label="Título o especialidad"
        class="mt-6"
        style="max-width: 480px"
      />

      <p class="text-subtitle-2 mt-4 mb-1">¿En qué niveles impartes clase?</p>
      <v-checkbox
        v-for="nivel in NIVELES"
        :key="nivel"
        v-model="nivelesElegidos"
        :label="nivel"
        :value="nivel"
        density="compact"
        hide-details
      />

      <template v-for="fila in filasPorTurno" :key="fila.nombreTurno">
        <p class="text-subtitle-2 mt-6 mb-1">{{ fila.nombreTurno }}</p>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Día</th>
              <th>Disponible</th>
              <th>Entrada</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dia in fila.dias" :key="dia">
              <td>{{ dia }}</td>
              <td>
                <v-checkbox
                  v-model="bloques[claveBloque(fila.turnoId, dia)].disponible"
                  density="compact"
                  hide-details
                />
              </td>
              <td>
                <v-text-field
                  v-model="bloques[claveBloque(fila.turnoId, dia)].horaEntrada"
                  type="time"
                  density="compact"
                  hide-details
                  :disabled="!bloques[claveBloque(fila.turnoId, dia)].disponible"
                />
              </td>
              <td>
                <v-text-field
                  v-model="bloques[claveBloque(fila.turnoId, dia)].horaSalida"
                  type="time"
                  density="compact"
                  hide-details
                  :disabled="!bloques[claveBloque(fila.turnoId, dia)].disponible"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <template v-if="nivelesElegidos.length">
        <p class="text-subtitle-2 mt-6 mb-1">Materias que puedes impartir</p>
        <v-select
          v-model="materiaIdsElegidas"
          multiple
          chips
          item-title="nombre"
          item-value="id"
          :items="materiasDisponibles"
          style="max-width: 480px"
          :hint="materiasDisponibles.length === 0 ? 'Todavía no hay materias cargadas para este nivel.' : ''"
          persistent-hint
        />
      </template>

      <v-btn color="primary" class="mt-6" :loading="guardando" @click="guardar">
        Guardar disponibilidad
      </v-btn>
    </template>
  </v-container>
</template>
