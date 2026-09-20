import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos con la forma exacta de contrato/openapi.yaml.
// GET/POST /turnos y PATCH /turnos/{id}/baja: propuesta pendiente de acordar
// con Carlitos.
//
// Nombres reales: Matutino, Nocturno y Sabatino son los turnos documentados
// en "Plan de Programacion.docx" para Licenciatura y BGTR.
let turnosFalsos = [
  { id: '1', nombre: 'Matutino', activo: true },
  { id: '2', nombre: 'Nocturno', activo: true },
  { id: '3', nombre: 'Sabatino', activo: true }
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

async function listarTurnosFalso({ pagina, tamanoPagina, texto }) {
  await esperar(300)
  let filtrados = turnosFalsos.filter((t) => t.activo)
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtrados = filtrados.filter((t) => t.nombre.toLowerCase().includes(textoBusqueda))
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearTurnoFalso(datos) {
  await esperar(300)
  const yaExiste = turnosFalsos.some(
    (t) => t.activo && t.nombre.toLowerCase() === datos.nombre.toLowerCase()
  )
  if (yaExiste) {
    throw new Error('Ya existe un turno con ese nombre')
  }
  const nuevo = { id: String(Date.now()), nombre: datos.nombre, activo: true }
  turnosFalsos = [nuevo, ...turnosFalsos]
  return nuevo
}

async function darDeBajaTurnoFalso(id) {
  await esperar(300)
  const turno = turnosFalsos.find((t) => t.id === id)
  if (!turno) {
    throw new Error('El turno no existe')
  }
  turno.activo = false
  return turno
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarTurnos(filtros) {
  if (usaDatosFalsos) {
    return listarTurnosFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/turnos', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearTurno(datos) {
  if (usaDatosFalsos) {
    return crearTurnoFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/turnos', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaTurno(id) {
  if (usaDatosFalsos) {
    return darDeBajaTurnoFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/turnos/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
