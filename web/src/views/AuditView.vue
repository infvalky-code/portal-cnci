<script setup>
import { ref, computed } from 'vue'
import { listarAuditoria } from '@/services/audit'

const TAMANO_PAGINA = 20

const ENTIDADES = [
  'Periodo', 'Carrera', 'Turno', 'Aula', 'Materia', 'Grupo', 'Alumno', 'Docente',
  'Dispositivo', 'Horario', 'ProyectoFinal'
]

const COLOR_ACCION = {
  Alta: 'success',
  Edición: 'warning',
  Baja: 'error',
  Publicación: 'success',
  VistoBueno: 'success',
  Cierre: 'warning'
}

const filtroEntidad = ref(null)
const filtroUsuario = ref('')
const filtroFechaInicio = ref('')
const filtroFechaFin = ref('')

const registros = ref([])
const total = ref(0)
const pagina = ref(1)
const cargando = ref(false)
const seConsulto = ref(false)
const mensajeError = ref('')

const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / TAMANO_PAGINA)))

function formatearFecha(fechaISO) {
  return fechaISO.replace('T', ' ')
}

async function consultar(nuevaPagina = 1) {
  cargando.value = true
  mensajeError.value = ''
  try {
    const respuesta = await listarAuditoria({
      pagina: nuevaPagina,
      tamanoPagina: TAMANO_PAGINA,
      entidad: filtroEntidad.value,
      usuarioId: filtroUsuario.value || undefined,
      fechaInicio: filtroFechaInicio.value || undefined,
      fechaFin: filtroFechaFin.value || undefined
    })
    registros.value = respuesta.datos
    total.value = respuesta.total
    pagina.value = respuesta.pagina
    seConsulto.value = true
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <v-container fluid class="pa-6">
    <h1 class="text-h5 mb-4">Auditoría</h1>
    <p class="text-caption text-medium-emphasis mb-4">
      Bitácora de solo lectura: qué se creó, editó o dio de baja, quién y cuándo.
    </p>

    <v-row class="align-center" dense>
      <v-col cols="12" sm="2">
        <v-select v-model="filtroEntidad" label="Entidad" clearable :items="ENTIDADES" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field v-model="filtroUsuario" label="Usuario (nombre)" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-text-field v-model="filtroFechaInicio" label="Desde" type="date" />
      </v-col>
      <v-col cols="12" sm="2">
        <v-text-field v-model="filtroFechaFin" label="Hasta" type="date" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn color="primary" variant="outlined" block @click="consultar(1)">Consultar</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="mensajeError" type="error" density="compact" class="mt-4">
      {{ mensajeError }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate color="primary" class="mt-4" />

    <template v-else>
      <p v-if="!seConsulto" class="text-medium-emphasis mt-6">
        Elige los filtros y presiona "Consultar" para ver la bitácora.
      </p>

      <p v-else-if="registros.length === 0" class="text-medium-emphasis mt-6">
        No hay registros de auditoría con esos filtros.
      </p>

      <template v-else>
        <v-table class="mt-4">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Entidad</th>
              <th>Acción</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registro in registros" :key="registro.id">
              <td>{{ formatearFecha(registro.fecha) }}</td>
              <td>{{ registro.usuarioNombre }}</td>
              <td>{{ registro.usuarioRol }}</td>
              <td>{{ registro.entidad }}</td>
              <td>
                <v-chip :color="COLOR_ACCION[registro.accion]" size="small">
                  {{ registro.accion }}
                </v-chip>
              </td>
              <td>{{ registro.descripcion }}</td>
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
  </v-container>
</template>
