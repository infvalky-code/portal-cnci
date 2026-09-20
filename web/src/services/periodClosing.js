import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET/POST /cierre-tetramestre: propuesta pendiente de acordar con
// Carlitos. No incluye acuse de enterado ni segunda/tercera oportunidad
// como captura: los documentos del proyecto no definen campos ni flujo
// para eso todavía.
let cierresFalsos = []

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function vacio(periodoId) {
  return {
    periodoId,
    fechaFirmaActa: null,
    fechaExtraordinario: null,
    fechaTerceraOportunidad: null
  }
}

async function obtenerCierreTetramestreFalso(periodoId) {
  await esperar(200)
  return cierresFalsos.find((c) => c.periodoId === periodoId) ?? vacio(periodoId)
}

async function guardarCierreTetramestreFalso(cierre) {
  await esperar(300)
  cierresFalsos = cierresFalsos.filter((c) => c.periodoId !== cierre.periodoId)
  cierresFalsos.push(cierre)
  return cierre
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function obtenerCierreTetramestre(periodoId) {
  if (usaDatosFalsos) {
    return obtenerCierreTetramestreFalso(periodoId)
  }
  try {
    const respuesta = await httpClient.get('/cierre-tetramestre', { params: { periodoId } })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function guardarCierreTetramestre(cierre) {
  if (usaDatosFalsos) {
    return guardarCierreTetramestreFalso(cierre)
  }
  try {
    const respuesta = await httpClient.post('/cierre-tetramestre', cierre)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
