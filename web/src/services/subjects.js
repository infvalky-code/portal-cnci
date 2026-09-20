import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos con la forma exacta de contrato/openapi.yaml.
// GET/POST /materias y PATCH /materias/{id}/baja: propuesta pendiente de
// acordar con Carlitos.
//
// Las 3 materias de BGTR son reales: sus claves (BI1CTR, MA1CTR, QU1CTR)
// están documentadas en "Formatos institucionales CNCI.docx" (mapa
// curricular). No hay materias de licenciatura: CNCI solo publica su malla
// curricular como PDF por carrera (no accesible como texto), así que el
// catálogo queda vacío para esas carreras hasta que se consiga el PDF o
// llegue la importación masiva por Excel/CSV (ya listada como pendiente).
let materiasFalsas = [
  { id: '1', clave: 'BI1CTR', nombre: 'Biología I', carreraId: '1', activo: true },
  { id: '2', clave: 'MA1CTR', nombre: 'Matemáticas I', carreraId: '1', activo: true },
  { id: '3', clave: 'QU1CTR', nombre: 'Química I', carreraId: '1', activo: true }
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

async function listarMateriasFalso({ pagina, tamanoPagina, carreraId, texto }) {
  await esperar(300)
  let filtradas = materiasFalsas.filter((m) => m.activo)
  if (carreraId) {
    filtradas = filtradas.filter((m) => m.carreraId === carreraId)
  }
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtradas = filtradas.filter(
      (m) =>
        m.nombre.toLowerCase().includes(textoBusqueda) || m.clave.toLowerCase().includes(textoBusqueda)
    )
  }
  return paginar(filtradas, pagina, tamanoPagina)
}

async function crearMateriaFalso(datos) {
  await esperar(300)
  const yaExiste = materiasFalsas.some(
    (m) => m.activo && m.clave.toLowerCase() === datos.clave.toLowerCase()
  )
  if (yaExiste) {
    throw new Error('Ya existe una materia con esa clave')
  }
  const nueva = {
    id: String(Date.now()),
    clave: datos.clave,
    nombre: datos.nombre,
    carreraId: datos.carreraId,
    activo: true
  }
  materiasFalsas = [nueva, ...materiasFalsas]
  return nueva
}

async function darDeBajaMateriaFalso(id) {
  await esperar(300)
  const materia = materiasFalsas.find((m) => m.id === id)
  if (!materia) {
    throw new Error('La materia no existe')
  }
  materia.activo = false
  return materia
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarMaterias(filtros) {
  if (usaDatosFalsos) {
    return listarMateriasFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/materias', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearMateria(datos) {
  if (usaDatosFalsos) {
    return crearMateriaFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/materias', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function darDeBajaMateria(id) {
  if (usaDatosFalsos) {
    return darDeBajaMateriaFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/materias/${id}/baja`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
