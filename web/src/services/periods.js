import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos inventados, con la forma exacta de contrato/openapi.yaml.
// GET/POST /periodos y PATCH /periodos/{id}/baja: propuesta pendiente de
// acordar con Carlitos.
let periodosFalsos = [
  {
    id: '1',
    nombre: 'Tetramestre Sep-Dic 2026',
    fechaInicio: '2026-09-01',
    fechaFin: '2026-12-15',
    estatus: 'Abierto',
    activo: true
  },
  {
    id: '2',
    nombre: 'Tetramestre May-Ago 2026',
    fechaInicio: '2026-05-01',
    fechaFin: '2026-08-15',
    estatus: 'Cerrado',
    activo: true
  },
  {
    id: '3',
    nombre: 'Tetramestre Ene-Abr 2026',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-04-15',
    estatus: 'Cerrado',
    activo: true
  }
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

async function listarPeriodosFalso({ pagina, tamanoPagina, estatus, texto }) {
  await esperar(300)
  let filtrados = periodosFalsos.filter((p) => p.activo)
  if (estatus) {
    filtrados = filtrados.filter((p) => p.estatus === estatus)
  }
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtrados = filtrados.filter((p) => p.nombre.toLowerCase().includes(textoBusqueda))
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearPeriodoFalso(datos) {
  await esperar(300)
  const yaExiste = periodosFalsos.some(
    (p) => p.activo && p.nombre.toLowerCase() === datos.nombre.toLowerCase()
  )
  if (yaExiste) {
    throw new Error('Ya existe un periodo con ese nombre')
  }
  const nuevo = {
    id: String(Date.now()),
    nombre: datos.nombre,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    estatus: 'Abierto',
    activo: true
  }
  periodosFalsos = [nuevo, ...periodosFalsos]
  return nuevo
}

async function darDeBajaPeriodoFalso(id) {
  await esperar(300)
  const periodo = periodosFalsos.find((p) => p.id === id)
  if (!periodo) {
    throw new Error('El periodo no existe')
  }
  if (periodo.estatus === 'Abierto') {
    throw new Error('No se puede dar de baja un periodo abierto, ciérralo primero')
  }
  periodo.activo = false
  return periodo
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarPeriodos(filtros) {
  if (usaDatosFalsos) {
    return listarPeriodosFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/periodos', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearPeriodo(datos) {
  if (usaDatosFalsos) {
    return crearPeriodoFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/periodos', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaPeriodo(id) {
  if (usaDatosFalsos) {
    return darDeBajaPeriodoFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/periodos/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
