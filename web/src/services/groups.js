import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos con la forma exacta de contrato/openapi.yaml.
// GET/POST /grupos y PATCH /grupos/{id}/baja: propuesta pendiente de acordar
// con Carlitos. Los grupos son cohortes internas de la escuela, sin fuente
// pública: ejemplos inventados que referencian periodos, carreras y turnos
// reales ya cargados en sus catálogos.
let gruposFalsos = [
  { id: '1', nombre: 'BGTR-1A', periodoId: '1', carreraId: '1', turnoId: '1', cupo: 30, activo: true },
  { id: '2', nombre: 'LADM-1A', periodoId: '1', carreraId: '3', turnoId: '2', cupo: 35, activo: true }
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

async function listarGruposFalso({ pagina, tamanoPagina, periodoId, carreraId, texto }) {
  await esperar(300)
  let filtrados = gruposFalsos.filter((g) => g.activo)
  if (periodoId) {
    filtrados = filtrados.filter((g) => g.periodoId === periodoId)
  }
  if (carreraId) {
    filtrados = filtrados.filter((g) => g.carreraId === carreraId)
  }
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtrados = filtrados.filter((g) => g.nombre.toLowerCase().includes(textoBusqueda))
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearGrupoFalso(datos) {
  await esperar(300)
  const yaExiste = gruposFalsos.some(
    (g) =>
      g.activo &&
      g.nombre.toLowerCase() === datos.nombre.toLowerCase() &&
      g.periodoId === datos.periodoId
  )
  if (yaExiste) {
    throw new Error('Ya existe un grupo con ese nombre en ese periodo')
  }
  const nuevo = {
    id: String(Date.now()),
    nombre: datos.nombre,
    periodoId: datos.periodoId,
    carreraId: datos.carreraId,
    turnoId: datos.turnoId,
    cupo: datos.cupo,
    activo: true
  }
  gruposFalsos = [nuevo, ...gruposFalsos]
  return nuevo
}

async function darDeBajaGrupoFalso(id) {
  await esperar(300)
  const grupo = gruposFalsos.find((g) => g.id === id)
  if (!grupo) {
    throw new Error('El grupo no existe')
  }
  grupo.activo = false
  return grupo
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarGrupos(filtros) {
  if (usaDatosFalsos) {
    return listarGruposFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/grupos', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearGrupo(datos) {
  if (usaDatosFalsos) {
    return crearGrupoFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/grupos', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaGrupo(id) {
  if (usaDatosFalsos) {
    return darDeBajaGrupoFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/grupos/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
