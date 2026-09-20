import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET/POST /calificaciones: propuesta pendiente de acordar con Carlitos.
let calificacionesFalsas = []

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function listarCalificacionesFalso(grupoId, materiaId) {
  await esperar(300)
  return calificacionesFalsas.filter((c) => c.grupoId === grupoId && c.materiaId === materiaId)
}

async function guardarCalificacionesFalso(grupoId, materiaId, registros) {
  await esperar(300)
  for (const registro of registros) {
    const parcialInvalido = registro.parciales.some(
      (p) => p !== null && (p < 0 || p > 10)
    )
    if (parcialInvalido) {
      throw new Error('Las calificaciones deben estar entre 0 y 10')
    }
  }
  calificacionesFalsas = calificacionesFalsas.filter(
    (c) => !(c.grupoId === grupoId && c.materiaId === materiaId)
  )
  for (const registro of registros) {
    calificacionesFalsas.push({ grupoId, materiaId, alumnoId: registro.alumnoId, parciales: registro.parciales })
  }
  return registros
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarCalificaciones(grupoId, materiaId) {
  if (usaDatosFalsos) {
    return listarCalificacionesFalso(grupoId, materiaId)
  }
  try {
    const respuesta = await httpClient.get('/calificaciones', { params: { grupoId, materiaId } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function guardarCalificaciones(grupoId, materiaId, registros) {
  if (usaDatosFalsos) {
    return guardarCalificacionesFalso(grupoId, materiaId, registros)
  }
  try {
    const respuesta = await httpClient.post('/calificaciones', { grupoId, materiaId, registros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
