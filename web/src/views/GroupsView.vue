<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarGrupos, crearGrupo, darDeBajaGrupo } from '@/services/groups'
import { listarPeriodos } from '@/services/periods'
import { listarCarreras } from '@/services/careers'
import { listarTurnos } from '@/services/shifts'

const TAMANO_PAGINA = 20

const periodos = ref([])
const carreras = ref([])
const turnos = ref([])

onMounted(async () => {
  const [respuestaPeriodos, respuestaCarreras, respuestaTurnos] = await Promise.all([
    listarPeriodos({ pagina: 1, tamanoPagina: 100 }),
    listarCarreras({ pagina: 1, tamanoPagina: 100 }),
    listarTurnos({ pagina: 1, tamanoPagina: 100 })
  ])
  periodos.value = respuestaPeriodos.datos
  carreras.value = respuestaCarreras.datos
  turnos.value = respuestaTurnos.datos
})

function nombrePeriodo(id) {
  return periodos.value.find((p) => p.id === id)?.nombre ?? id
}
function nombreCarrera(id) {
  return carreras.value.find((c) => c.id === id)?.nombre ?? id
}
function nombreTurno(id) {
  return turnos.value.find((t) => t.id === id)?.nombre ?? id
}

const filtroPeriodoId = ref(null)
const filtroCarreraId = ref(null)
const filtroTexto = ref('')

const grupos = ref([])
const total = ref(0)
const pagina = ref(1)
const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')

const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / TAMANO_PAGINA)))

async function consultar(nuevaPagina = 1) {
  cargando.value = true
  mensajeError.value = ''
  try {
    const respuesta = await listarGrupos({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      periodoId: filtroPeriodoId.value,
      carreraId: filtroCarreraId.value,
      texto: filtroTexto.value || undefined
    })
    grupos.value = respuesta.datos
    total.value = respuesta.total
    pagina.value = respuesta.pagina
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

const dialogoAbierto = ref(false)
const guardando = ref(false)
const mensajeErrorAlta = ref('')
const nuevoGrupo = ref({ nombre: '', periodoId: null, carreraId: null, turnoId: null, cupo: null })

function abrirAlta() {
  nuevoGrupo.value = { nombre: '', periodoId: null, carreraId: null, turnoId: null, cupo: null }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearGrupo(nuevoGrupo.value)
    dialogoAbierto.value = false
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const dandoDeBajaId = ref(null)

async function darDeBaja(grupo) {
  dandoDeBajaId.value = grupo.id
  mensajeError.value = ''
  try {
    await darDeBajaGrupo(grupo.id)
    await consultar(pagina.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    dandoDeBajaId.value = null
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Grupos</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroPeriodoId"
          label="Periodo"
          clearable
          item-title="nombre"
          item-value="id"
          :items="periodos"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroCarreraId"
          label="Carrera"
          clearable
          item-title="nombre"
          item-value="id"
          :items="carreras"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre" />
      </v-col>
      <v-col cols="12" sm="1">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="2" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nuevo grupo</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver los grupos.
      </p>

      <p v-else-if="grupos.length === 0" class="text-medium-emphasis mt-6">
        No hay grupos con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Periodo</th>
              <th>Carrera</th>
              <th>Turno</th>
              <th>Cupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="grupo in grupos" :key="grupo.id">
              <td>{{ grupo.nombre }}</td>
              <td>{{ nombrePeriodo(grupo.periodoId) }}</td>
              <td>{{ nombreCarrera(grupo.carreraId) }}</td>
              <td>{{ nombreTurno(grupo.turnoId) }}</td>
              <td>{{ grupo.cupo }}</td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="dandoDeBajaId === grupo.id"
                  @click="darDeBaja(grupo)"
                >
                  Dar de baja
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-pagination
          v-if="totalPaginas > 1"
          v-model="pagina"
          :length="totalPaginas"
          class="mt-4"
          @update:model-value="consultar"
        />
      </template>
    </template>

    <v-dialog v-model="dialogoAbierto" max-width="480">
      <v-card title="Nuevo grupo" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevoGrupo.nombre" label="Nombre" />
          <v-select
            v-model="nuevoGrupo.periodoId"
            label="Periodo"
            item-title="nombre"
            item-value="id"
            :items="periodos"
          />
          <v-select
            v-model="nuevoGrupo.carreraId"
            label="Carrera"
            item-title="nombre"
            item-value="id"
            :items="carreras"
          />
          <v-select
            v-model="nuevoGrupo.turnoId"
            label="Turno"
            item-title="nombre"
            item-value="id"
            :items="turnos"
          />
          <v-text-field v-model.number="nuevoGrupo.cupo" label="Cupo" type="number" />
          <v-alert v-if="mensajeErrorAlta" type="error" density="compact" class="mb-4">
            {{ mensajeErrorAlta }}
          </v-alert>
          <v-card-actions class="pl-0">
            <v-spacer />
            <v-btn variant="text" @click="dialogoAbierto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="guardando">Guardar</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>
