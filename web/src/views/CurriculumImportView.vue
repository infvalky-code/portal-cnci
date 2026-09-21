<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listarCarreras } from '@/services/careers'
import { listarMaterias, crearMateria } from '@/services/subjects'
import { leerHojaDeArchivo } from '@/services/exportHelpers'
import { evaluarFilasImportacion } from '@/utils/curriculumImportValidation'

const router = useRouter()

const carreras = ref([])
const carreraId = ref(null)
const archivo = ref(null)

onMounted(async () => {
  const respuesta = await listarCarreras({ pagina: 1, tamanoPagina: 100 })
  carreras.value = respuesta.datos
})

const leyendo = ref(false)
const mensajeErrorLectura = ref('')
const filas = ref([])
const seLeyoArchivo = ref(false)

async function leerArchivo() {
  if (!archivo.value || !carreraId.value) return
  leyendo.value = true
  mensajeErrorLectura.value = ''
  seLeyoArchivo.value = false
  try {
    const leidas = await leerHojaDeArchivo(archivo.value)
    const materiasExistentes = await listarMaterias({
      pagina: 1,
      tamanoPagina: 500,
      carreraId: carreraId.value
    })
    const clavesExistentes = new Set(materiasExistentes.datos.map((m) => m.clave.toLowerCase()))
    filas.value = evaluarFilasImportacion(leidas, clavesExistentes)
    seLeyoArchivo.value = true
  } catch (error) {
    mensajeErrorLectura.value = error.message
  } finally {
    leyendo.value = false
  }
}

const filasSeleccionadas = computed(() => filas.value.filter((f) => f.incluir))

const importando = ref(false)
const resumenImportacion = ref(null)

async function importar() {
  importando.value = true
  resumenImportacion.value = null
  let creadas = 0
  const errores = []
  for (const fila of filasSeleccionadas.value) {
    try {
      await crearMateria({ clave: fila.clave, nombre: fila.nombre, carreraId: carreraId.value })
      creadas++
    } catch (error) {
      errores.push({ clave: fila.clave, mensaje: error.message })
    }
  }
  resumenImportacion.value = { creadas, errores }
  importando.value = false
  filas.value = []
  seLeyoArchivo.value = false
  archivo.value = null
}

function volver() {
  router.push('/catalogos/materias')
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Importar mapa curricular</h1>
    <p class="text-caption text-medium-emphasis mb-4">
      Da de alta varias materias de una carrera a partir de un archivo .xlsx o .csv con dos
      columnas: clave y nombre.
    </p>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="4">
        <v-select
          v-model="carreraId"
          label="Carrera"
          item-title="nombre"
          item-value="id"
          :items="carreras"
        />
      </v-col>
      <v-col cols="12" sm="5">
        <v-file-input
          v-model="archivo"
          label="Archivo (.xlsx o .csv)"
          accept=".xlsx,.csv"
          show-size
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn
          color="primary"
          variant="outlined"
          block
          :disabled="!archivo || !carreraId"
          :loading="leyendo"
          @click="leerArchivo"
        >
          Leer archivo
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeErrorLectura" type="error" density="compact" class="mt-4">
      {{ mensajeErrorLectura }}
    </v-alert>

    <template v-if="seLeyoArchivo">
      <p v-if="filas.length === 0" class="text-medium-emphasis mt-6">
        El archivo no tiene filas con clave y nombre.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th></th>
              <th>Clave</th>
              <th>Nombre</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, i) in filas" :key="i">
              <td>
                <v-checkbox
                  v-model="fila.incluir"
                  density="compact"
                  hide-details
                  :disabled="fila.estado !== 'Válida'"
                />
              </td>
              <td>{{ fila.clave }}</td>
              <td>{{ fila.nombre }}</td>
              <td>
                <v-chip :color="fila.estado === 'Válida' ? 'success' : 'warning'" size="small">
                  {{ fila.estado }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-btn
          color="primary"
          class="mt-4"
          :disabled="filasSeleccionadas.length === 0"
          :loading="importando"
          @click="importar"
        >
          Importar {{ filasSeleccionadas.length }} materia(s)
        </v-btn>
      </template>
    </template>

    <v-alert v-if="resumenImportacion" type="success" density="compact" class="mt-4">
      Se crearon {{ resumenImportacion.creadas }} materia(s).
      <template v-if="resumenImportacion.errores.length > 0">
        {{ resumenImportacion.errores.length }} fallaron:
        <ul>
          <li v-for="(error, i) in resumenImportacion.errores" :key="i">
            {{ error.clave }}: {{ error.mensaje }}
          </li>
        </ul>
      </template>
    </v-alert>

    <v-btn variant="text" class="mt-4" @click="volver">Volver a Materias</v-btn>
  </v-container>
</template>
