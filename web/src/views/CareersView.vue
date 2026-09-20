<script setup>
import { ref, computed } from 'vue'
import { listarCarreras, crearCarrera, darDeBajaCarrera } from '@/services/careers'

const TAMANO_PAGINA = 20

const filtroNivel = ref(null)
const filtroTexto = ref('')

const carreras = ref([])
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
    const respuesta = await listarCarreras({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      nivel: filtroNivel.value,
      texto: filtroTexto.value || undefined
    })
    carreras.value = respuesta.datos
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
const nuevaCarrera = ref({ nombre: '', clave: '', nivel: null })

function abrirAlta() {
  nuevaCarrera.value = { nombre: '', clave: '', nivel: null }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearCarrera(nuevaCarrera.value)
    dialogoAbierto.value = false
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const dandoDeBajaId = ref(null)

async function darDeBaja(carrera) {
  dandoDeBajaId.value = carrera.id
  mensajeError.value = ''
  try {
    await darDeBajaCarrera(carrera.id)
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
    <h1 class="text-h5 mb-4">Carreras</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroNivel"
          label="Nivel"
          clearable
          :items="['Licenciatura', 'Bachillerato']"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre o clave" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="2" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nueva carrera</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver las carreras.
      </p>

      <p v-else-if="carreras.length === 0" class="text-medium-emphasis mt-6">
        No hay carreras con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Nombre</th>
              <th>Nivel</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="carrera in carreras" :key="carrera.id">
              <td>{{ carrera.clave }}</td>
              <td>{{ carrera.nombre }}</td>
              <td>{{ carrera.nivel }}</td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="dandoDeBajaId === carrera.id"
                  @click="darDeBaja(carrera)"
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
      <v-card title="Nueva carrera" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevaCarrera.nombre" label="Nombre" />
          <v-text-field v-model="nuevaCarrera.clave" label="Clave" />
          <v-select
            v-model="nuevaCarrera.nivel"
            label="Nivel"
            :items="['Licenciatura', 'Bachillerato']"
          />
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
