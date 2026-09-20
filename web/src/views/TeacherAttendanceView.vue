<script setup>
import { ref, onMounted } from 'vue'
import { listarAsistenciaDocentes, registrarAsistenciaDocenteManual } from '@/services/teacherAttendance'
import { listarPeriodos } from '@/services/periods'
import { listarDocentes } from '@/services/teachers'

const ESTADO_COLOR = { 'A tiempo': 'success', Retardo: 'warning', Falta: 'error' }

const periodosAbiertos = ref([])
const docentes = ref([])

onMounted(async () => {
  const [rPeriodos, rDocentes] = await Promise.all([
    listarPeriodos({ pagina: 1, tamanoPagina: 100, estatus: 'Abierto' }),
    listarDocentes({ pagina: 1, tamanoPagina: 100 })
  ])
  periodosAbiertos.value = rPeriodos.datos
  docentes.value = rDocentes.datos
})

function nombreDocente(id) {
  return docentes.value.find((d) => d.id === id)?.nombre ?? id
}

const filtroPeriodoId = ref(null)
const filtroFecha = ref(new Date().toISOString().slice(0, 10))
const filtroDocenteId = ref(null)

const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')
const registros = ref([])

async function consultar() {
  if (!filtroPeriodoId.value || !filtroFecha.value) {
    mensajeError.value = 'Elige el periodo y la fecha antes de consultar.'
    return
  }
  cargando.value = true
  mensajeError.value = ''
  try {
    registros.value = await listarAsistenciaDocentes({
      periodoId: filtroPeriodoId.value,
      docenteId: filtroDocenteId.value,
      fecha: filtroFecha.value
    })
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}

const dialogoAbierto = ref(false)
const registrando = ref(false)
const mensajeErrorManual = ref('')
const registroManual = ref({ docenteId: null, dia: '', horaEntrada: '', horaSalida: '' })

function abrirRegistroManual(registro) {
  registroManual.value = {
    docenteId: registro.docenteId,
    dia: registro.dia,
    horaEntrada: '',
    horaSalida: ''
  }
  mensajeErrorManual.value = ''
  dialogoAbierto.value = true
}

async function guardarRegistroManual() {
  registrando.value = true
  mensajeErrorManual.value = ''
  try {
    await registrarAsistenciaDocenteManual({
      docenteId: registroManual.value.docenteId,
      periodoId: filtroPeriodoId.value,
      fecha: filtroFecha.value,
      dia: registroManual.value.dia,
      horaEntrada: registroManual.value.horaEntrada,
      horaSalida: registroManual.value.horaSalida
    })
    dialogoAbierto.value = false
    await consultar()
  } catch (error) {
    mensajeErrorManual.value = error.message
  } finally {
    registrando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Asistencia de docentes</h1>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroPeriodoId"
          label="Periodo"
          item-title="nombre"
          item-value="id"
          :items="periodosAbiertos"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field v-model="filtroFecha" label="Fecha" type="date" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="filtroDocenteId"
          label="Docente (opcional)"
          clearable
          item-title="nombre"
          item-value="id"
          :items="docentes"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn color="primary" variant="outlined" block @click="consultar">Consultar</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige el periodo y la fecha, y presiona "Consultar".
      </p>

      <p v-else-if="registros.length === 0" class="text-medium-emphasis mt-6">
        Nadie tenía clase programada ese día según su disponibilidad.
      </p>

      <v-table v-else class="mt-4">
        <thead>
          <tr>
            <th>Docente</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Origen</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="registro in registros" :key="registro.id">
            <td>{{ nombreDocente(registro.docenteId) }}</td>
            <td>{{ registro.horaEntrada ?? '—' }}</td>
            <td>{{ registro.horaSalida ?? '—' }}</td>
            <td>{{ registro.horasTrabajadas ? registro.horasTrabajadas.toFixed(1) : '—' }}</td>
            <td>{{ registro.origen ?? '—' }}</td>
            <td>
              <v-chip :color="ESTADO_COLOR[registro.estado]" size="small">
                {{ registro.estado }}
              </v-chip>
            </td>
            <td>
              <v-btn
                v-if="registro.estado === 'Falta'"
                size="small"
                variant="text"
                @click="abrirRegistroManual(registro)"
              >
                Registrar entrada manual
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>

    <v-dialog v-model="dialogoAbierto" max-width="420">
      <v-card title="Registro manual de checada" class="pa-4">
        <p class="text-caption text-medium-emphasis mb-2">
          Para cuando el lector falla: no es un parche, es un camino normal de captura.
        </p>
        <v-form @submit.prevent="guardarRegistroManual">
          <v-text-field v-model="registroManual.horaEntrada" label="Hora de entrada" type="time" />
          <v-text-field v-model="registroManual.horaSalida" label="Hora de salida" type="time" />
          <v-alert v-if="mensajeErrorManual" type="error" density="compact" class="mb-4">
            {{ mensajeErrorManual }}
          </v-alert>
          <v-card-actions class="pl-0">
            <v-spacer />
            <v-btn variant="text" @click="dialogoAbierto = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" :loading="registrando">Guardar</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>
