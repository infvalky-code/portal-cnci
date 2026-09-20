import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET/POST /disponibilidad: propuesta pendiente de acordar con Carlitos.
// En la base real, disponibilidad_docente necesita distinguir nivel y
// turno, no solo turno (pendiente ya documentado en el proyecto).
let disponibilidadesFalsas = []

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function vacia(docenteId, periodoId) {
  return { docenteId, periodoId, especialidadTitulo: '', niveles: [], bloques: [], materiaIds: [] }
}

async function obtenerDisponibilidadFalso(docenteId, periodoId) {
  await esperar(300)
  const existente = disponibilidadesFalsas.find(
    (d) => d.docenteId === docenteId && d.periodoId === periodoId
  )
  return existente ?? vacia(docenteId, periodoId)
}

async function guardarDisponibilidadFalso(disponibilidad) {
  await esperar(300)
  disponibilidadesFalsas = disponibilidadesFalsas.filter(
    (d) => !(d.docenteId === disponibilidad.docenteId && d.periodoId === disponibilidad.periodoId)
  )
  disponibilidadesFalsas.push(disponibilidad)
  return disponibilidad
}

async function listarDisponibilidadesPeriodoFalso(periodoId) {
  await esperar(300)
  return disponibilidadesFalsas.filter((d) => d.periodoId === periodoId)
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarDisponibilidadesPeriodo(periodoId) {
  if (usaDatosFalsos) {
    return listarDisponibilidadesPeriodoFalso(periodoId)
  }
  try {
    const respuesta = await httpClient.get('/disponibilidades', { params: { periodoId } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function obtenerDisponibilidad(docenteId, periodoId) {
  if (usaDatosFalsos) {
    return obtenerDisponibilidadFalso(docenteId, periodoId)
  }
  try {
    const respuesta = await httpClient.get('/disponibilidad', { params: { docenteId, periodoId } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function guardarDisponibilidad(disponibilidad) {
  if (usaDatosFalsos) {
    return guardarDisponibilidadFalso(disponibilidad)
  }
  try {
    const respuesta = await httpClient.post('/disponibilidad', disponibilidad)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
