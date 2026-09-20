import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria: registros de asistencia por grupo + fecha.
// GET/POST /grupos/{grupoId}/asistencia y GET /alumnos/{id}/asistencias:
// propuesta pendiente de acordar con Carlitos.
//
// "Clases de hoy" no existe todavía (depende de Horarios, fase 3): el
// docente elige el grupo directamente en vez de partir de una sesión del
// horario. Se ajusta cuando exista disponibilidad_docente + horario_clase.
let asistenciasFalsas = [
  { grupoId: '1', alumnoId: '1', fecha: '2026-09-19', estado: 'Presente' }
]

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function obtenerAsistenciaGrupoFalso(grupoId, fecha) {
  await esperar(300)
  const registros = asistenciasFalsas
    .filter((a) => a.grupoId === grupoId && a.fecha === fecha)
    .map((a) => ({ alumnoId: a.alumnoId, estado: a.estado }))
  return { fecha, registros }
}

async function guardarAsistenciaGrupoFalso(grupoId, fecha, registros) {
  await esperar(300)
  asistenciasFalsas = asistenciasFalsas.filter(
    (a) => !(a.grupoId === grupoId && a.fecha === fecha)
  )
  for (const registro of registros) {
    asistenciasFalsas.push({
      grupoId,
      alumnoId: registro.alumnoId,
      fecha,
      estado: registro.estado
    })
  }
  return { fecha, registros }
}

async function obtenerHistorialAsistenciaAlumnoFalso(alumnoId) {
  await esperar(300)
  return asistenciasFalsas
    .filter((a) => a.alumnoId === alumnoId)
    .map((a) => ({ fecha: a.fecha, estado: a.estado, grupoId: a.grupoId }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function obtenerAsistenciaGrupo(grupoId, fecha) {
  if (usaDatosFalsos) {
    return obtenerAsistenciaGrupoFalso(grupoId, fecha)
  }
  try {
    const respuesta = await httpClient.get(`/grupos/${grupoId}/asistencia`, { params: { fecha } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function guardarAsistenciaGrupo(grupoId, fecha, registros) {
  if (usaDatosFalsos) {
    return guardarAsistenciaGrupoFalso(grupoId, fecha, registros)
  }
  try {
    const respuesta = await httpClient.post(`/grupos/${grupoId}/asistencia`, { fecha, registros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function obtenerHistorialAsistenciaAlumno(alumnoId) {
  if (usaDatosFalsos) {
    return obtenerHistorialAsistenciaAlumnoFalso(alumnoId)
  }
  try {
    const respuesta = await httpClient.get(`/alumnos/${alumnoId}/asistencias`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
