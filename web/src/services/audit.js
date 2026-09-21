import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET /auditoria: propuesta pendiente de acordar con Carlitos. Es un
// catálogo de solo lectura: la bitácora la genera la propia API central en
// cada operación, el portal nunca la captura ni la modifica a mano.
//
// Datos inventados de ejemplo (no hay bitácora real todavía).
const registrosFalsos = [
  {
    id: '1',
    fecha: '2026-09-15T09:03:00',
    usuarioNombre: 'Ana Control',
    usuarioRol: 'Control escolar',
    entidad: 'Alumno',
    entidadId: '1',
    accion: 'Alta',
    descripcion: 'Alta de alumno con matrícula 1320G130'
  },
  {
    id: '2',
    fecha: '2026-09-16T11:20:00',
    usuarioNombre: 'Valky Administrador',
    usuarioRol: 'Administrador',
    entidad: 'Dispositivo',
    entidadId: '1',
    accion: 'Baja',
    descripcion: 'Baja del dispositivo checador de Aula 3 por reemplazo de equipo'
  },
  {
    id: '3',
    fecha: '2026-09-18T16:45:00',
    usuarioNombre: 'Ana Control',
    usuarioRol: 'Control escolar',
    entidad: 'Horario',
    entidadId: '1',
    accion: 'Publicación',
    descripcion: 'Publicación del horario del periodo Tetramestre Septiembre-Diciembre 2026'
  },
  {
    id: '4',
    fecha: '2026-09-19T10:12:00',
    usuarioNombre: 'Ana Control',
    usuarioRol: 'Control escolar',
    entidad: 'ProyectoFinal',
    entidadId: '2',
    accion: 'VistoBueno',
    descripcion: 'Visto bueno aprobado al proyecto final de Ingeniería en Tecnologías Computacionales'
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

async function listarAuditoriaFalso({ pagina, tamanoPagina, entidad, usuarioId, fechaInicio, fechaFin }) {
  await esperar(300)
  let filtrados = registrosFalsos
  if (entidad) {
    filtrados = filtrados.filter((r) => r.entidad === entidad)
  }
  if (usuarioId) {
    // No hay catálogo de usuarios en el portal todavía (los roles hoy son
    // fijos: admin/docente1/control1), así que el fake busca por texto sobre
    // el nombre en vez de comparar contra un id real de usuario.
    const textoUsuario = usuarioId.toLowerCase()
    filtrados = filtrados.filter((r) => r.usuarioNombre.toLowerCase().includes(textoUsuario))
  }
  if (fechaInicio) {
    filtrados = filtrados.filter((r) => r.fecha.slice(0, 10) >= fechaInicio)
  }
  if (fechaFin) {
    filtrados = filtrados.filter((r) => r.fecha.slice(0, 10) <= fechaFin)
  }
  filtrados = [...filtrados].sort((a, b) => b.fecha.localeCompare(a.fecha))
  return paginar(filtrados, pagina, tamanoPagina)
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarAuditoria(filtros) {
  if (usaDatosFalsos) {
    return listarAuditoriaFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/auditoria', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
