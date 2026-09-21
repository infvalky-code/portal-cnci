<script setup>
import { ref, computed } from 'vue'
import { listarDocentes, crearDocente, darDeBajaDocente } from '@/services/teachers'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const TAMANO_PAGINA = 20

const filtroEstadoHuella = ref(null)
const filtroTexto = ref('')

const docentes = ref([])
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
    const respuesta = await listarDocentes({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      estadoHuella: filtroEstadoHuella.value,
      texto: filtroTexto.value || undefined
    })
    docentes.value = respuesta.datos
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
const nuevoDocente = ref({ nombre: '', especialidad: '', cedulaProfesional: '' })

function abrirAlta() {
  nuevoDocente.value = { nombre: '', especialidad: '', cedulaProfesional: '' }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearDocente(nuevoDocente.value)
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

async function darDeBaja(docente) {
  dandoDeBajaId.value = docente.id
  mensajeError.value = ''
  try {
    await darDeBajaDocente(docente.id)
    await consultar(pagina.value)
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    dandoDeBajaId.value = null
  }
}

async function confirmarBaja() {
  const docente = confirmandoBaja.value
  confirmandoBaja.value = null
  await darDeBaja(docente)
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Docentes</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroEstadoHuella"
          label="Estado de huella"
          clearable
          :items="['Pendiente', 'Enrolada']"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre o cédula" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="2" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nuevo docente</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver los docentes.
      </p>

      <p v-else-if="docentes.length === 0" class="text-medium-emphasis mt-6">
        No hay docentes con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Especialidad</th>
              <th>Cédula profesional</th>
              <th>Huella</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="docente in docentes" :key="docente.id">
              <td>{{ docente.nombre }}</td>
              <td>{{ docente.especialidad }}</td>
              <td>{{ docente.cedulaProfesional }}</td>
              <td>
                <v-chip
                  :color="docente.estadoHuella === 'Enrolada' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ docente.estadoHuella }}
                </v-chip>
              </td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="dandoDeBajaId === docente.id"
                  @click="confirmandoBaja = docente"
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
      <v-card title="Nuevo docente" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevoDocente.nombre" label="Nombre completo" />
          <v-text-field v-model="nuevoDocente.especialidad" label="Especialidad" />
          <v-text-field v-model="nuevoDocente.cedulaProfesional" label="Cédula profesional" />
          <p class="text-caption text-medium-emphasis">
            La huella se enrola desde el reloj checador, no desde aquí. El docente queda con
            estado "Pendiente" hasta que se enrole.
          </p>
          <v-alert v-if="mensajeErrorAlta" type="error" density="compact" class="mb-4 mt-2">
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
      :message="`¿Dar de baja al docente ${confirmandoBaja?.nombre}? Podrás seguir consultándolo pero no aparecerá en las listas activas.`"
      :loading="dandoDeBajaId === confirmandoBaja?.id"
      @update:model-value="confirmandoBaja = null"
      @confirm="confirmarBaja"
    />
  </v-container>
</template>
