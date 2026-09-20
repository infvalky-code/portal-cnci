import httpClient, { usaDatosFalsos } from './httpClient'

const PREFIJO_MATRICULA = '1320'
const FORMATO_SUFIJO = /^[A-Z]\d{3}$/

// Datos falsos inventados (nunca alumnos reales de la escuela). La matrícula
// respeta el formato real documentado en "Cambios en la base de datos
// escolar.docx": prefijo fijo 1320 + 1 letra + 3 dígitos, antepuesto por un
// trigger de la base. Los sufijos usados aquí no coinciden con matrículas
// reales existentes (que van de 001 a 028).
let alumnosFalsos = [
  {
    id: '1',
    matricula: '1320A050',
    nombre: 'Ana Torres Villarreal',
    carreraId: '1',
    grupoId: '1',
    tutorNombre: 'Rosa Villarreal',
    tutorTelefono: '8111234567',
    contactoEmergenciaNombre: 'Rosa Villarreal',
    contactoEmergenciaTelefono: '8111234567',
    activo: true
  },
  {
    id: '2',
    matricula: '1320F077',
    nombre: 'Luis Fernández Garza',
    carreraId: '3',
    grupoId: '2',
    tutorNombre: 'Marta Garza',
    tutorTelefono: '8117654321',
    contactoEmergenciaNombre: 'Jorge Fernández',
    contactoEmergenciaTelefono: '8119876543',
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

async function listarAlumnosFalso({ pagina, tamanoPagina, carreraId, grupoId, texto }) {
  await esperar(300)
  let filtrados = alumnosFalsos.filter((a) => a.activo)
  if (carreraId) {
    filtrados = filtrados.filter((a) => a.carreraId === carreraId)
  }
  if (grupoId) {
    filtrados = filtrados.filter((a) => a.grupoId === grupoId)
  }
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtrados = filtrados.filter(
      (a) =>
        a.nombre.toLowerCase().includes(textoBusqueda) ||
        a.matricula.toLowerCase().includes(textoBusqueda)
    )
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearAlumnoFalso(datos) {
  await esperar(300)
  const sufijo = (datos.matriculaSufijo ?? '').toUpperCase()
  if (!FORMATO_SUFIJO.test(sufijo)) {
    throw new Error('La matrícula debe ser 1 letra seguida de 3 dígitos, ej. G130')
  }
  const matricula = PREFIJO_MATRICULA + sufijo
  const yaExiste = alumnosFalsos.some((a) => a.activo && a.matricula === matricula)
  if (yaExiste) {
    throw new Error('Ya existe un alumno con esa matrícula')
  }
  const nuevo = {
    id: String(Date.now()),
    matricula,
    nombre: datos.nombre,
    carreraId: datos.carreraId,
    grupoId: datos.grupoId || null,
    tutorNombre: datos.tutorNombre ?? '',
    tutorTelefono: datos.tutorTelefono ?? '',
    contactoEmergenciaNombre: datos.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono: datos.contactoEmergenciaTelefono ?? '',
    activo: true
  }
  alumnosFalsos = [nuevo, ...alumnosFalsos]
  return nuevo
}

async function darDeBajaAlumnoFalso(id) {
  await esperar(300)
  const alumno = alumnosFalsos.find((a) => a.id === id)
  if (!alumno) {
    throw new Error('El alumno no existe')
  }
  alumno.activo = false
  return alumno
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarAlumnos(filtros) {
  if (usaDatosFalsos) {
    return listarAlumnosFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/alumnos', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearAlumno(datos) {
  if (usaDatosFalsos) {
    return crearAlumnoFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/alumnos', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaAlumno(id) {
  if (usaDatosFalsos) {
    return darDeBajaAlumnoFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/alumnos/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
