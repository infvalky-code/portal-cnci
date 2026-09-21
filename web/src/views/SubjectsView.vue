<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listarMaterias, crearMateria, darDeBajaMateria } from '@/services/subjects'
import { listarCarreras } from '@/services/careers'

const router = useRouter()

const TAMANO_PAGINA = 20

const carreras = ref([])

onMounted(async () => {
  const respuesta = await listarCarreras({ pagina: 1, tamanoPagina: 100 })
  carreras.value = respuesta.datos
})

function nombreCarrera(carreraId) {
  return carreras.value.find((c) => c.id === carreraId)?.nombre ?? carreraId
}

const filtroCarreraId = ref(null)
const filtroTexto = ref('')

const materias = ref([])
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
    const respuesta = await listarMaterias({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      carreraId: filtroCarreraId.value,
      texto: filtroTexto.value || undefined
    })
    materias.value = respuesta.datos
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
const nuevaMateria = ref({ clave: '', nombre: '', carreraId: null })

function abrirAlta() {
  nuevaMateria.value = { clave: '', nombre: '', carreraId: null }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearMateria(nuevaMateria.value)
    dialogoAbierto.value = false
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const dandoDeBajaId = ref(null)

async function darDeBaja(materia) {
  dandoDeBajaId.value = materia.id
  mensajeError.value = ''
  try {
    await darDeBajaMateria(materia.id)
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
    <h1 class="text-h5 mb-4">Materias</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="filtroCarreraId"
          label="Carrera"
          clearable
          item-title="nombre"
          item-value="id"
          :items="carreras"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre o clave" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="1" class="text-sm-right">
        <v-btn color="primary" variant="outlined" block @click="router.push('/catalogos/materias/importar')">
          Importar
        </v-btn>
      </v-col>
      <v-col cols="12" sm="1" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nueva materia</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver las materias.
      </p>

      <p v-else-if="materias.length === 0" class="text-medium-emphasis mt-6">
        No hay materias con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Nombre</th>
              <th>Carrera</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="materia in materias" :key="materia.id">
              <td>{{ materia.clave }}</td>
              <td>{{ materia.nombre }}</td>
              <td>{{ nombreCarrera(materia.carreraId) }}</td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="dandoDeBajaId === materia.id"
                  @click="darDeBaja(materia)"
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
      <v-card title="Nueva materia" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field v-model="nuevaMateria.nombre" label="Nombre" />
          <v-text-field v-model="nuevaMateria.clave" label="Clave" />
          <v-select
            v-model="nuevaMateria.carreraId"
            label="Carrera"
            item-title="nombre"
            item-value="id"
            :items="carreras"
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
