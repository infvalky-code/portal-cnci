import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos inventados (nunca docentes reales de la escuela), con la
// forma exacta de contrato/openapi.yaml. estadoHuella es solo un estatus:
// el enrolamiento real lo hace la app del reloj checador (Brandon), el
// portal nunca maneja la plantilla biométrica.
let docentesFalsos = [
  {
    id: '1',
    nombre: 'Juan Pérez Salinas',
    especialidad: 'Matemáticas',
    cedulaProfesional: '10203040',
    estadoHuella: 'Enrolada',
    activo: true
  },
  {
    id: '2',
    nombre: 'María López Cantú',
    especialidad: 'Administración de Empresas',
    cedulaProfesional: '50607080',
    estadoHuella: 'Pendiente',
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

async function listarDocentesFalso({ pagina, tamanoPagina, estadoHuella, texto }) {
  await esperar(300)
  let filtrados = docentesFalsos.filter((d) => d.activo)
  if (estadoHuella) {
    filtrados = filtrados.filter((d) => d.estadoHuella === estadoHuella)
  }
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtrados = filtrados.filter(
      (d) =>
        d.nombre.toLowerCase().includes(textoBusqueda) ||
        d.cedulaProfesional.toLowerCase().includes(textoBusqueda)
    )
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearDocenteFalso(datos) {
  await esperar(300)
  const yaExiste = docentesFalsos.some(
    (d) => d.activo && d.cedulaProfesional === datos.cedulaProfesional
  )
  if (yaExiste) {
    throw new Error('Ya existe un docente con esa cédula profesional')
  }
  const nuevo = {
    id: String(Date.now()),
    nombre: datos.nombre,
    especialidad: datos.especialidad,
    cedulaProfesional: datos.cedulaProfesional,
    estadoHuella: 'Pendiente',
    activo: true
  }
  docentesFalsos = [nuevo, ...docentesFalsos]
  return nuevo
}

async function darDeBajaDocenteFalso(id) {
  await esperar(300)
  const docente = docentesFalsos.find((d) => d.id === id)
  if (!docente) {
    throw new Error('El docente no existe')
  }
  docente.activo = false
  return docente
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarDocentes(filtros) {
  if (usaDatosFalsos) {
    return listarDocentesFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/docentes', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearDocente(datos) {
  if (usaDatosFalsos) {
    return crearDocenteFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/docentes', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaDocente(id) {
  if (usaDatosFalsos) {
    return darDeBajaDocenteFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/docentes/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
