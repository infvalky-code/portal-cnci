<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'
import {
  listarProyectosFinales,
  crearProyectoFinal,
  darVistoBuenoProyectoFinal
} from '@/services/finalProjects'
import { listarPeriodos } from '@/services/periods'
import { listarCarreras } from '@/services/careers'
import { listarDocentes } from '@/services/teachers'

const TAMANO_PAGINA = 20

const session = useSessionStore()
const esControlEscolar = computed(() => session.rol === 'Control escolar')

const COLOR_ESTATUS = { Pendiente: 'warning', Aprobado: 'success', Regresado: 'error' }

const periodos = ref([])
const carreras = ref([])
const docentes = ref([])

onMounted(async () => {
  const [respuestaPeriodos, respuestaCarreras, respuestaDocentes] = await Promise.all([
    listarPeriodos({ pagina: 1, tamanoPagina: 100 }),
    listarCarreras({ pagina: 1, tamanoPagina: 100 }),
    listarDocentes({ pagina: 1, tamanoPagina: 100 })
  ])
  periodos.value = respuestaPeriodos.datos
  carreras.value = respuestaCarreras.datos
  docentes.value = respuestaDocentes.datos
})

function nombrePeriodo(id) {
  return periodos.value.find((p) => p.id === id)?.nombre ?? id
}
function nombreCarrera(id) {
  return carreras.value.find((c) => c.id === id)?.nombre ?? id
}
function nombreDocente(id) {
  return docentes.value.find((d) => d.id === id)?.nombre ?? id
}

const filtroPeriodoId = ref(null)
const filtroCarreraId = ref(null)
const filtroDocenteId = ref(null)

const proyectos = ref([])
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
    const respuesta = await listarProyectosFinales({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      periodoId: filtroPeriodoId.value,
      carreraId: filtroCarreraId.value,
      docenteId: filtroDocenteId.value
    })
    proyectos.value = respuesta.datos
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
const nuevoProyecto = ref({
  periodoId: null,
  carreraId: null,
  docenteId: null,
  titulo: '',
  alumnosParticipantes: ''
})

function abrirAlta() {
  nuevoProyecto.value = {
    periodoId: filtroPeriodoId.value,
    carreraId: null,
    docenteId: null,
    titulo: '',
    alumnosParticipantes: ''
  }
  mensajeErrorAlta.value = ''
  dialogoAbierto.value = true
}

async function guardarAlta() {
  guardando.value = true
  mensajeErrorAlta.value = ''
  try {
    await crearProyectoFinal(nuevoProyecto.value)
    dialogoAbierto.value = false
    await consultar(1)
  } catch (error) {
    mensajeErrorAlta.value = error.message
  } finally {
    guardando.value = false
  }
}

const dialogoVistoBuenoAbierto = ref(false)
const proyectoEnRevision = ref(null)
const estatusVistoBueno = ref('Aprobado')
const comentarioVistoBueno = ref('')
const guardandoVistoBueno = ref(false)
const mensajeErrorVistoBueno = ref('')

function abrirVistoBueno(proyecto) {
  proyectoEnRevision.value = proyecto
  estatusVistoBueno.value = 'Aprobado'
  comentarioVistoBueno.value = ''
  mensajeErrorVistoBueno.value = ''
  dialogoVistoBuenoAbierto.value = true
}

async function guardarVistoBueno() {
  guardandoVistoBueno.value = true
  mensajeErrorVistoBueno.value = ''
  try {
    await darVistoBuenoProyectoFinal(proyectoEnRevision.value.id, {
      estatus: estatusVistoBueno.value,
      comentarioCoordinacion: comentarioVistoBueno.value || undefined
    })
    dialogoVistoBuenoAbierto.value = false
    await consultar(pagina.value)
  } catch (error) {
    mensajeErrorVistoBueno.value = error.message
  } finally {
    guardandoVistoBueno.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Proyectos finales</h1>

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
        <v-select
          v-model="filtroDocenteId"
          label="Docente"
          clearable
          item-title="nombre"
          item-value="id"
          :items="docentes"
        />
      </v-col>
      <v-col cols="12" sm="1">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
      <v-col cols="12" sm="2" class="text-sm-right">
        <v-btn color="primary" block @click="abrirAlta">Nuevo proyecto</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver los proyectos finales.
      </p>

      <p v-else-if="proyectos.length === 0" class="text-medium-emphasis mt-6">
        No hay proyectos finales con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Carrera</th>
              <th>Título</th>
              <th>Docente asesor</th>
              <th>Alumnos participantes</th>
              <th>Estatus</th>
              <th v-if="esControlEscolar">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proyecto in proyectos" :key="proyecto.id">
              <td>{{ nombrePeriodo(proyecto.periodoId) }}</td>
              <td>{{ nombreCarrera(proyecto.carreraId) }}</td>
              <td>{{ proyecto.titulo }}</td>
              <td>{{ nombreDocente(proyecto.docenteId) }}</td>
              <td>{{ proyecto.alumnosParticipantes }}</td>
              <td>
                <v-chip :color="COLOR_ESTATUS[proyecto.estatus]" size="small">
                  {{ proyecto.estatus }}
                </v-chip>
              </td>
              <td v-if="esControlEscolar">
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  @click="abrirVistoBueno(proyecto)"
                >
                  Dar visto bueno
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
      <v-card title="Nuevo proyecto final" class="pa-4">
        <v-form @submit.prevent="guardarAlta">
          <v-select
            v-model="nuevoProyecto.periodoId"
            label="Periodo"
            item-title="nombre"
            item-value="id"
            :items="periodos"
          />
          <v-select
            v-model="nuevoProyecto.carreraId"
            label="Carrera"
            item-title="nombre"
            item-value="id"
            :items="carreras"
          />
          <v-select
            v-model="nuevoProyecto.docenteId"
            label="Docente asesor"
            item-title="nombre"
            item-value="id"
            :items="docentes"
          />
          <v-text-field v-model="nuevoProyecto.titulo" label="Título del proyecto" class="mt-4" />
          <v-textarea
            v-model="nuevoProyecto.alumnosParticipantes"
            label="Alumnos participantes"
            hint="Nombre completo de cada alumno, separados por coma"
            persistent-hint
          />
          <v-alert v-if="mensajeErrorAlta" type="error" density="compact" class="mb-4 mt-4">
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

    <v-dialog v-model="dialogoVistoBuenoAbierto" max-width="480">
      <v-card title="Visto bueno de Coordinación" class="pa-4">
        <v-form @submit.prevent="guardarVistoBueno">
          <v-select
            v-model="estatusVistoBueno"
            label="Resultado"
            :items="['Aprobado', 'Regresado']"
          />
          <v-textarea
            v-model="comentarioVistoBueno"
            label="Comentario para el docente (opcional)"
          />
          <v-alert v-if="mensajeErrorVistoBueno" type="error" density="compact" class="mb-4">
            {{ mensajeErrorVistoBueno }}
          </v-alert>
          <v-card-actions class="pl-0">
            <v-spacer />
            <v-btn variant="text" @click="dialogoVistoBuenoAbierto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="guardandoVistoBueno">Guardar</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>
