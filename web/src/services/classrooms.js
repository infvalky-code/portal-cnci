import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos con la forma exacta de contrato/openapi.yaml.
// GET/POST /aulas y PATCH /aulas/{id}/baja: propuesta pendiente de acordar
// con Carlitos.
//
// La infraestructura de aulas es interna de la escuela y no se publica en
// ningún lado; estos son ejemplos inventados, no datos reales de CNCI.
let aulasFalsas = [
  { id: '1', clave: 'A101', capacidad: 30, activo: true },
  { id: '2', clave: 'A102', capacidad: 30, activo: true },
  { id: '3', clave: 'B201', capacidad: 40, activo: true }
]

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function paginar(lista, pagina, tamanoPagina) {
  const inicio = (pagina - 1) * tamanoPagina
  return {
    datos: lista.slice(inicio, inicio + tamanoPagina),
    total: lista.length,
    pagina,
    tamanoPagina
  }
}

async function listarAulasFalso({ pagina, tamanoPagina, texto }) {
  await esperar(300)
  let filtradas = aulasFalsas.filter((a) => a.activo)
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtradas = filtradas.filter((a) => a.clave.toLowerCase().includes(textoBusqueda))
  }
  return paginar(filtradas, pagina, tamanoPagina)
}

async function crearAulaFalso(datos) {
  await esperar(300)
  const yaExiste = aulasFalsas.some(
    (a) => a.activo && a.clave.toLowerCase() === datos.clave.toLowerCase()
  )
  if (yaExiste) {
    throw new Error('Ya existe un aula con esa clave')
  }
  const nueva = {
    id: String(Date.now()),
    clave: datos.clave,
    capacidad: datos.capacidad,
    activo: true
  }
  aulasFalsas = [nueva, ...aulasFalsas]
  return nueva
}

async function darDeBajaAulaFalso(id) {
  await esperar(300)
  const aula = aulasFalsas.find((a) => a.id === id)
  if (!aula) {
    throw new Error('El aula no existe')
  }
  aula.activo = false
  return aula
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarAulas(filtros) {
  if (usaDatosFalsos) {
    return listarAulasFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/aulas', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearAula(datos) {
  if (usaDatosFalsos) {
    return crearAulaFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/aulas', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaAula(id) {
  if (usaDatosFalsos) {
    return darDeBajaAulaFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/aulas/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
