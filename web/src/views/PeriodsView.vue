<script setup>
import { ref, computed } from 'vue'
import { listarPeriodos, crearPeriodo, darDeBajaPeriodo } from '@/services/periods'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const TAMANO_PAGINA = 20

const filtroEstatus = ref(null)
const filtroTexto = ref('')

const periodos = ref([])
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
    const respuesta = await listarPeriodos({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      estatus: filtroEstatus.value,
      texto: filtroTexto.value || undefined
    })
    periodos.value = respuesta.datos
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
const nuevoPeriodo = ref({ nombre: '', fechaInicio: '', fechaFin: '' })

function abrirAlta() {
  nuevoPeriodo.value = { nombre: '', fechaInicio: '', fechaFin: '' }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearPeriodo(nuevoPeriodo.value)
    dialogoAbierto.value = false
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const dandoDeBajaId = ref(null)
const confirmandoBaja = ref(null)

async function darDeBaja(periodo) {
  dandoDeBajaId.value = periodo.id
  mensajeError.value = ''
  try {
    await darDeBajaPeriodo(periodo.id)
    await consultar(pagina.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    dandoDeBajaId.value = null
  }
}

async function confirmarBaja() {
  const periodo = confirmandoBaja.value
  confirmandoBaja.value = null
  await darDeBaja(periodo)
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Periodos</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroEstatus"
          label="Estatus"
          clearable
          :items="['Abierto', 'Cerrado']"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="2" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nuevo periodo</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver los periodos.
      </p>

      <p v-else-if="periodos.length === 0" class="text-medium-emphasis mt-6">
        No hay periodos con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="periodo in periodos" :key="periodo.id">
              <td>{{ periodo.nombre }}</td>
              <td>{{ periodo.fechaInicio }}</td>
              <td>{{ periodo.fechaFin }}</td>
              <td>
                <v-chip :color="periodo.estatus === 'Abierto' ? 'primary' : undefined" size="small">
                  {{ periodo.estatus }}
                </v-chip>
              </td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :disabled="periodo.estatus === 'Abierto'"
                  :loading="dandoDeBajaId === periodo.id"
                  @click="confirmandoBaja = periodo"
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
      <v-card title="Nuevo periodo" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevoPeriodo.nombre" label="Nombre" />
          <v-text-field v-model="nuevoPeriodo.fechaInicio" label="Fecha inicio" type="date" />
          <v-text-field v-model="nuevoPeriodo.fechaFin" label="Fecha fin" type="date" />
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

    <ConfirmDialog
      :model-value="confirmandoBaja !== null"
      title="Dar de baja"
      :message="`¿Dar de baja el periodo ${confirmandoBaja?.nombre}? Podrás seguir consultándolo pero no aparecerá en las listas activas.`"
      :loading="dandoDeBajaId === confirmandoBaja?.id"
      @update:model-value="confirmandoBaja = null"
      @confirm="confirmarBaja"
    />
  </v-container>
</template>
