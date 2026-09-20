import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET/POST /horarios, /horarios/publicado y /horarios/publicar: propuesta
// pendiente de acordar con Carlitos.
//
// Empalmes de aula y de docente los rechaza la base (409); fuera de la
// disponibilidad declarada del docente es solo aviso (el portal lo valida
// aparte, no aquí). El armado no es automático: el sistema sugiere y
// valida, la decisión es de Coordinación.
let bloquesFalsos = []
let publicacionesFalsas = []

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function listarHorariosFalso(periodoId) {
  await esperar(300)
  return bloquesFalsos.filter((b) => b.periodoId === periodoId)
}

async function guardarBloqueHorarioFalso(bloque) {
  await esperar(300)
  const empalmeDocente = bloquesFalsos.find(
    (b) =>
      b.periodoId === bloque.periodoId &&
      b.dia === bloque.dia &&
      b.turnoId === bloque.turnoId &&
      b.docenteId === bloque.docenteId &&
      b.grupoId !== bloque.grupoId
  )
  if (empalmeDocente) {
    throw new Error('Ese docente ya tiene otro grupo asignado en ese día y turno')
  }
  const empalmeAula = bloquesFalsos.find(
    (b) =>
      b.periodoId === bloque.periodoId &&
      b.dia === bloque.dia &&
      b.turnoId === bloque.turnoId &&
      b.aulaId === bloque.aulaId &&
      b.grupoId !== bloque.grupoId
  )
  if (empalmeAula) {
    throw new Error('Esa aula ya está ocupada en ese día y turno')
  }
  bloquesFalsos = bloquesFalsos.filter(
    (b) => !(b.periodoId === bloque.periodoId && b.grupoId === bloque.grupoId && b.dia === bloque.dia)
  )
  bloquesFalsos.push(bloque)
  return bloque
}

async function obtenerPublicacionHorarioFalso(periodoId, grupoId) {
  await esperar(200)
  const existente = publicacionesFalsas.find(
    (p) => p.periodoId === periodoId && p.grupoId === grupoId
  )
  return { publicado: existente?.publicado ?? false }
}

async function publicarHorarioFalso(periodoId, grupoId) {
  await esperar(300)
  publicacionesFalsas = publicacionesFalsas.filter(
    (p) => !(p.periodoId === periodoId && p.grupoId === grupoId)
  )
  publicacionesFalsas.push({ periodoId, grupoId, publicado: true })
  return { publicado: true }
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarHorarios(periodoId) {
  if (usaDatosFalsos) {
    return listarHorariosFalso(periodoId)
  }
  try {
    const respuesta = await httpClient.get('/horarios', { params: { periodoId } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function guardarBloqueHorario(bloque) {
  if (usaDatosFalsos) {
    return guardarBloqueHorarioFalso(bloque)
  }
  try {
    const respuesta = await httpClient.post('/horarios', bloque)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function obtenerPublicacionHorario(periodoId, grupoId) {
  if (usaDatosFalsos) {
    return obtenerPublicacionHorarioFalso(periodoId, grupoId)
  }
  try {
    const respuesta = await httpClient.get('/horarios/publicado', { params: { periodoId, grupoId } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function publicarHorario(periodoId, grupoId) {
  if (usaDatosFalsos) {
    return publicarHorarioFalso(periodoId, grupoId)
  }
  try {
    const respuesta = await httpClient.patch('/horarios/publicar', { periodoId, grupoId })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
