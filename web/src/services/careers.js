import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos con la forma exacta de contrato/openapi.yaml.
// GET/POST /carreras y PATCH /carreras/{id}/baja: propuesta pendiente de
// acordar con Carlitos.
//
// Nombres y oferta académica: reales, tomados de cnci.edu.mx (carreras
// profesionales, carreras presenciales y preparatoria), septiembre 2026.
// Claves: BGTR, LEDU y LADM son las claves internas reales documentadas en
// "Cambios en la base de datos escolar.docx" (usadas ahí para la letra de la
// matrícula). Las demás claves son PROPUESTA de Valky — CNCI no publica sus
// códigos internos — pendientes de confirmar con Control escolar.
let carrerasFalsas = [
  { id: '1', nombre: 'Bachillerato General', clave: 'BGTR', nivel: 'Bachillerato', activo: true },
  { id: '2', nombre: 'Licenciatura en Educación', clave: 'LEDU', nivel: 'Licenciatura', activo: true },
  { id: '3', nombre: 'Licenciatura en Administración de Empresas', clave: 'LADM', nivel: 'Licenciatura', activo: true },
  { id: '4', nombre: 'Licenciatura en Derecho', clave: 'DERE', nivel: 'Licenciatura', activo: true },
  { id: '5', nombre: 'Contador Público', clave: 'CPUB', nivel: 'Licenciatura', activo: true },
  { id: '6', nombre: 'Licenciatura en Mercadotecnia', clave: 'MERC', nivel: 'Licenciatura', activo: true },
  { id: '7', nombre: 'Licenciatura en Diseño Gráfico', clave: 'DGRA', nivel: 'Licenciatura', activo: true },
  { id: '8', nombre: 'Ingeniería Industrial y de Sistemas', clave: 'IISI', nivel: 'Licenciatura', activo: true },
  { id: '9', nombre: 'Ingeniería en Tecnologías Computacionales', clave: 'ITCO', nivel: 'Licenciatura', activo: true }
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

async function listarCarrerasFalso({ pagina, tamanoPagina, nivel, texto }) {
  await esperar(300)
  let filtradas = carrerasFalsas.filter((c) => c.activo)
  if (nivel) {
    filtradas = filtradas.filter((c) => c.nivel === nivel)
  }
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtradas = filtradas.filter(
      (c) =>
        c.nombre.toLowerCase().includes(textoBusqueda) || c.clave.toLowerCase().includes(textoBusqueda)
    )
  }
  return paginar(filtradas, pagina, tamanoPagina)
}

async function crearCarreraFalso(datos) {
  await esperar(300)
  const yaExiste = carrerasFalsas.some(
    (c) => c.activo && c.clave.toLowerCase() === datos.clave.toLowerCase()
  )
  if (yaExiste) {
    throw new Error('Ya existe una carrera con esa clave')
  }
  const nueva = {
    id: String(Date.now()),
    nombre: datos.nombre,
    clave: datos.clave,
    nivel: datos.nivel,
    activo: true
  }
  carrerasFalsas = [nueva, ...carrerasFalsas]
  return nueva
}

async function darDeBajaCarreraFalso(id) {
  await esperar(300)
  const carrera = carrerasFalsas.find((c) => c.id === id)
  if (!carrera) {
    throw new Error('La carrera no existe')
  }
  carrera.activo = false
  return carrera
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarCarreras(filtros) {
  if (usaDatosFalsos) {
    return listarCarrerasFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/carreras', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearCarrera(datos) {
  if (usaDatosFalsos) {
    return crearCarreraFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/carreras', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaCarrera(id) {
  if (usaDatosFalsos) {
    return darDeBajaCarreraFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/carreras/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
