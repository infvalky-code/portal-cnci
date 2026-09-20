<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarAlumnos, crearAlumno, darDeBajaAlumno } from '@/services/students'
import { listarCarreras } from '@/services/careers'
import { listarGrupos } from '@/services/groups'

const TAMANO_PAGINA = 20

const carreras = ref([])
const grupos = ref([])

onMounted(async () => {
  const [respuestaCarreras, respuestaGrupos] = await Promise.all([
    listarCarreras({ pagina: 1, tamanoPagina: 100 }),
    listarGrupos({ pagina: 1, tamanoPagina: 100 })
  ])
  carreras.value = respuestaCarreras.datos
  grupos.value = respuestaGrupos.datos
})

function nombreCarrera(id) {
  return carreras.value.find((c) => c.id === id)?.nombre ?? id
}
function nombreGrupo(id) {
  return grupos.value.find((g) => g.id === id)?.nombre ?? '—'
}

const filtroCarreraId = ref(null)
const filtroGrupoId = ref(null)
const filtroTexto = ref('')

const alumnos = ref([])
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
    const respuesta = await listarAlumnos({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      carreraId: filtroCarreraId.value,
      grupoId: filtroGrupoId.value,
      texto: filtroTexto.value || undefined
    })
    alumnos.value = respuesta.datos
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
const nuevoAlumno = ref({
  matriculaSufijo: '',
  nombre: '',
  carreraId: null,
  grupoId: null,
  tutorNombre: '',
  tutorTelefono: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: ''
})

function abrirAlta() {
  nuevoAlumno.value = {
    matriculaSufijo: '',
    nombre: '',
    carreraId: null,
    grupoId: null,
    tutorNombre: '',
    tutorTelefono: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: ''
  }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearAlumno(nuevoAlumno.value)
    dialogoAbierto.value = false
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const dandoDeBajaId = ref(null)

async function darDeBaja(alumno) {
  dandoDeBajaId.value = alumno.id
  mensajeError.value = ''
  try {
    await darDeBajaAlumno(alumno.id)
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
    <h1 class="text-h5 mb-4">Alumnos</h1>

    <v-row class="align-center" dense>
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
        <v-select
          v-model="filtroGrupoId"
          label="Grupo"
          clearable
          item-title="nombre"
          item-value="id"
          :items="grupos"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field v-model="filtroTexto" label="Buscar por nombre o matrícula" />
      </v-col>
      <v-col cols="12" sm="1">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="2" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nuevo alumno</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver los alumnos.
      </p>

      <p v-else-if="alumnos.length === 0" class="text-medium-emphasis mt-6">
        No hay alumnos con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre</th>
              <th>Carrera</th>
              <th>Grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alumno in alumnos" :key="alumno.id">
              <td>{{ alumno.matricula }}</td>
              <td>{{ alumno.nombre }}</td>
              <td>{{ nombreCarrera(alumno.carreraId) }}</td>
              <td>{{ alumno.grupoId ? nombreGrupo(alumno.grupoId) : '—' }}</td>
              <td>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  :loading="dandoDeBajaId === alumno.id"
                  @click="darDeBaja(alumno)"
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

    <v-dialog v-model="dialogoAbierto" max-width="520">
      <v-card title="Nuevo alumno" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-text-field
            v-model="nuevoAlumno.matriculaSufijo"
            label="Matrícula (letra + 3 dígitos, ej. G130)"
            hint="La base antepone 1320 automáticamente"
            persistent-hint
          />
          <v-text-field v-model="nuevoAlumno.nombre" label="Nombre completo" class="mt-4" />
          <v-select
            v-model="nuevoAlumno.carreraId"
            label="Carrera"
            item-title="nombre"
            item-value="id"
            :items="carreras"
          />
          <v-select
            v-model="nuevoAlumno.grupoId"
            label="Grupo (opcional)"
            clearable
            item-title="nombre"
            item-value="id"
            :items="grupos"
          />
          <v-text-field v-model="nuevoAlumno.tutorNombre" label="Padre, madre o tutor" />
          <v-text-field v-model="nuevoAlumno.tutorTelefono" label="Teléfono del tutor" />
          <v-text-field
            v-model="nuevoAlumno.contactoEmergenciaNombre"
            label="Contacto de emergencia"
          />
          <v-text-field
            v-model="nuevoAlumno.contactoEmergenciaTelefono"
            label="Teléfono de emergencia"
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
