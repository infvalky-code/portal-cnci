<script setup>
import { ref, computed } from 'vue'
import { listarAulas, crearAula, darDeBajaAula } from '@/services/classrooms'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const TAMANO_PAGINA = 20

const filtroTexto = ref('')

const aulas = ref([])
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
    const respuesta = await listarAulas({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      texto: filtroTexto.value || undefined
    })
    aulas.value = respuesta.datos
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
const nuevaAula = ref({ clave: '', capacidad: null })

function abrirAlta() {
  nuevaAula.value = { clave: '', capacidad: null }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearAula(nuevaAula.value)
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

async function darDeBaja(aula) {
  dandoDeBajaId.value = aula.id
  mensajeError.value = ''
  try {
    await darDeBajaAula(aula.id)
    await consultar(pagina.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    dandoDeBajaId.value = null
  }
}

async function confirmarBaja() {
  const aula = confirmandoBaja.value
  confirmandoBaja.value = null
  await darDeBaja(aula)
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Aulas</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="6">
        <v-text-field v-model="filtroTexto" label="Buscar por clave" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="3" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nueva aula</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Presiona "Consultar" para ver las aulas.
      </p>

      <p v-else-if="aulas.length === 0" class="text-medium-emphasis mt-6">
        No hay aulas con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Capacidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="aula in aulas" :key="aula.id">
              <td>{{ aula.clave }}</td>
              <td>{{ aula.capacidad }}</td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="dandoDeBajaId === aula.id"
                  @click="confirmandoBaja = aula"
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
      <v-card title="Nueva aula" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevaAula.clave" label="Clave" />
          <v-text-field v-model.number="nuevaAula.capacidad" label="Capacidad" type="number" />
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
      :message="`¿Dar de baja el aula ${confirmandoBaja?.clave}? Podrás seguir consultándola pero no aparecerá en las listas activas.`"
      :loading="dandoDeBajaId === confirmandoBaja?.id"
      @update:model-value="confirmandoBaja = null"
      @confirm="confirmarBaja"
    />
  </v-container>
</template>
