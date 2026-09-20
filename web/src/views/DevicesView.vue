<script setup>
import { ref, computed } from 'vue'
import { listarDispositivos, crearDispositivo, rotarClaveDispositivo, revocarDispositivo } from '@/services/devices'

const TAMANO_PAGINA = 20

const filtroTexto = ref('')

const dispositivos = ref([])
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
    const respuesta = await listarDispositivos({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      texto: filtroTexto.value || undefined
    })
    dispositivos.value = respuesta.datos
    total.value = respuesta.total
    pagina.value = respuesta.pagina
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

const dialogoAltaAbierto = ref(false)
const guardando = ref(false)
const mensajeErrorAlta = ref('')
const nuevoDispositivo = ref({ nombre: '', ubicacion: '' })

function abrirAlta() {
  nuevoDispositivo.value = { nombre: '', ubicacion: '' }
  mensajeErrorAlta.value = ''
  dialogoAltaAbierto.value = true
}

const dialogoClaveAbierto = ref(false)
const claveGenerada = ref('')

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    const creado = await crearDispositivo(nuevoDispositivo.value)
    dialogoAltaAbierto.value = false
    claveGenerada.value = creado.apiKey
    dialogoClaveAbierto.value = true
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const rotandoId = ref(null)

async function rotarClave(dispositivo) {
  rotandoId.value = dispositivo.id
  mensajeError.value = ''
  try {
    const actualizado = await rotarClaveDispositivo(dispositivo.id)
    claveGenerada.value = actualizado.apiKey
    dialogoClaveAbierto.value = true
    await consultar(pagina.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    rotandoId.value = null
  }
}

const revocandoId = ref(null)

async function revocar(dispositivo) {
  revocandoId.value = dispositivo.id
  mensajeError.value = ''
  try {
    await revocarDispositivo(dispositivo.id)
    await consultar(pagina.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    revocandoId.value = null
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Dispositivos</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="6">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre o ubicación" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="3" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nuevo dispositivo</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Presiona "Consultar" para ver los dispositivos.
      </p>

      <p v-else-if="dispositivos.length === 0" class="text-medium-emphasis mt-6">
        No hay dispositivos con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ubicación</th>
              <th>Clave</th>
              <th>Conexión</th>
              <th>Última sincronización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dispositivo in dispositivos" :key="dispositivo.id">
              <td>{{ dispositivo.nombre }}</td>
              <td>{{ dispositivo.ubicacion }}</td>
              <td><code>{{ dispositivo.apiKeyMascara }}</code></td>
              <td>
                <v-chip :color="dispositivo.enLinea ? 'success' : 'error'" size="small">
                  {{ dispositivo.enLinea ? 'En línea' : 'Sin conexión' }}
                </v-chip>
              </td>
              <td>{{ dispositivo.ultimaSincronizacion ?? 'Nunca' }}</td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  :loading="rotandoId === dispositivo.id"
                  @click="rotarClave(dispositivo)"
                >
                  Rotar clave
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="revocandoId === dispositivo.id"
                  @click="revocar(dispositivo)"
                >
                  Revocar
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

    <v-dialog v-model="dialogoAltaAbierto" max-width="480">
      <v-card title="Nuevo dispositivo" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevoDispositivo.nombre" label="Nombre" />
          <v-text-field v-model="nuevoDispositivo.ubicacion" label="Ubicación" />
          <v-alert v-if="mensajeErrorAlta" type="error" density="compact" class="mb-4">
            {{ mensajeErrorAlta }}
          </v-alert>
          <v-card-actions class="pl-0">
            <v-spacer />
            <v-btn variant="text" @click="dialogoAltaAbierto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="guardando">Guardar</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogoClaveAbierto" max-width="480" persistent>
      <v-card title="Clave del dispositivo" class="pa-4">
        <v-alert type="warning" density="compact" class="mb-4">
          Cópiala ahora: no se volverá a mostrar completa.
        </v-alert>
        <v-text-field :model-value="claveGenerada" label="Clave" readonly />
        <v-card-actions class="pl-0">
          <v-spacer />
          <v-btn color="primary" @click="dialogoClaveAbierto = false">Listo, ya la copié</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
