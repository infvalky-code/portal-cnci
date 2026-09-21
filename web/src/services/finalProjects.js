import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET/POST /proyectos-finales, PATCH /proyectos-finales/{id} y
// POST /proyectos-finales/{id}/visto-bueno: propuesta pendiente de acordar
// con Carlitos. Los alumnos participantes van en texto libre porque los
// alumnos no tienen cuenta ni registro individual en el portal.
//
// Datos inventados de ejemplo (proyectos, títulos): no hay proyectos finales
// reales documentados en los avances del proyecto.
let proyectosFalsos = [
  {
    id: '1',
    periodoId: '1',
    carreraId: '2',
    titulo: 'Estrategias de tutoría entre pares en educación media superior',
    docenteId: '1',
    alumnosParticipantes: 'García López Ana, Hernández Ruiz Luis',
    estatus: 'Pendiente',
    comentarioCoordinacion: null,
    fechaVistoBueno: null
  },
  {
    id: '2',
    periodoId: '1',
    carreraId: '9',
    titulo: 'Sistema de control de inventarios para pequeñas empresas',
    docenteId: '2',
    alumnosParticipantes: 'Martínez Sánchez Diego',
    estatus: 'Aprobado',
    comentarioCoordinacion: 'Cumple con los lineamientos de titulación.',
    fechaVistoBueno: '2026-09-10'
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

async function listarProyectosFinalesFalso({ pagina, tamanoPagina, periodoId, carreraId, docenteId }) {
  await esperar(300)
  let filtrados = proyectosFalsos
  if (periodoId) {
    filtrados = filtrados.filter((p) => p.periodoId === periodoId)
  }
  if (carreraId) {
    filtrados = filtrados.filter((p) => p.carreraId === carreraId)
  }
  if (docenteId) {
    filtrados = filtrados.filter((p) => p.docenteId === docenteId)
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearProyectoFinalFalso(datos) {
  await esperar(300)
  const nuevo = {
    id: String(Date.now()),
    periodoId: datos.periodoId,
    carreraId: datos.carreraId,
    titulo: datos.titulo,
    docenteId: datos.docenteId,
    alumnosParticipantes: datos.alumnosParticipantes,
    estatus: 'Pendiente',
    comentarioCoordinacion: null,
    fechaVistoBueno: null
  }
  proyectosFalsos = [nuevo, ...proyectosFalsos]
  return nuevo
}

async function editarProyectoFinalFalso(id, datos) {
  await esperar(300)
  const proyecto = proyectosFalsos.find((p) => p.id === id)
  if (!proyecto) {
    throw new Error('El proyecto final no existe')
  }
  proyecto.titulo = datos.titulo
  proyecto.carreraId = datos.carreraId
  proyecto.docenteId = datos.docenteId
  proyecto.alumnosParticipantes = datos.alumnosParticipantes
  return proyecto
}

async function darVistoBuenoProyectoFinalFalso(id, { estatus, comentarioCoordinacion }) {
  await esperar(300)
  const proyecto = proyectosFalsos.find((p) => p.id === id)
  if (!proyecto) {
    throw new Error('El proyecto final no existe')
  }
  proyecto.estatus = estatus
  proyecto.comentarioCoordinacion = comentarioCoordinacion ?? null
  proyecto.fechaVistoBueno = new Date().toISOString().slice(0, 10)
  return proyecto
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarProyectosFinales(filtros) {
  if (usaDatosFalsos) {
    return listarProyectosFinalesFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/proyectos-finales', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearProyectoFinal(datos) {
  if (usaDatosFalsos) {
    return crearProyectoFinalFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/proyectos-finales', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function editarProyectoFinal(id, datos) {
  if (usaDatosFalsos) {
    return editarProyectoFinalFalso(id, datos)
  }
  try {
    const respuesta = await httpClient.patch(`/proyectos-finales/${id}`, datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darVistoBuenoProyectoFinal(id, datos) {
  if (usaDatosFalsos) {
    return darVistoBuenoProyectoFinalFalso(id, datos)
  }
  try {
    const respuesta = await httpClient.post(`/proyectos-finales/${id}/visto-bueno`, datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
