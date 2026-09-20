import httpClient, { usaDatosFalsos } from './httpClient'

// Datos falsos inventados, con la forma exacta de contrato/openapi.yaml.
// GET/POST /dispositivos, PATCH /dispositivos/{id}/rotar-clave y
// PATCH /dispositivos/{id}/revocar: propuesta pendiente de acordar con
// Carlitos. La clave completa nunca se guarda aquí ni se vuelve a mostrar
// después de generarse; solo queda la máscara.
let dispositivosFalsos = [
  {
    id: '1',
    nombre: 'Lector sala de maestros',
    ubicacion: 'Sala de maestros, Campus Cumbres',
    apiKeyMascara: '••••a1b2',
    enLinea: true,
    ultimaSincronizacion: '2026-09-20T07:58:00',
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

function generarClave() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function mascaraDe(clave) {
  return `••••${clave.slice(-4)}`
}

async function listarDispositivosFalso({ pagina, tamanoPagina, texto }) {
  await esperar(300)
  let filtrados = dispositivosFalsos.filter((d) => d.activo)
  if (texto) {
    const textoBusqueda = texto.toLowerCase()
    filtrados = filtrados.filter(
      (d) =>
        d.nombre.toLowerCase().includes(textoBusqueda) ||
        d.ubicacion.toLowerCase().includes(textoBusqueda)
    )
  }
  return paginar(filtrados, pagina, tamanoPagina)
}

async function crearDispositivoFalso(datos) {
  await esperar(300)
  const yaExiste = dispositivosFalsos.some(
    (d) => d.activo && d.nombre.toLowerCase() === datos.nombre.toLowerCase()
  )
  if (yaExiste) {
    throw new Error('Ya existe un dispositivo con ese nombre')
  }
  const claveCompleta = generarClave()
  const nuevo = {
    id: String(Date.now()),
    nombre: datos.nombre,
    ubicacion: datos.ubicacion,
    apiKeyMascara: mascaraDe(claveCompleta),
    enLinea: false,
    ultimaSincronizacion: null,
    activo: true
  }
  dispositivosFalsos = [nuevo, ...dispositivosFalsos]
  return { ...nuevo, apiKey: claveCompleta }
}

async function rotarClaveDispositivoFalso(id) {
  await esperar(300)
  const dispositivo = dispositivosFalsos.find((d) => d.id === id)
  if (!dispositivo) {
    throw new Error('El dispositivo no existe')
  }
  const claveCompleta = generarClave()
  dispositivo.apiKeyMascara = mascaraDe(claveCompleta)
  return { ...dispositivo, apiKey: claveCompleta }
}

async function revocarDispositivoFalso(id) {
  await esperar(300)
  const dispositivo = dispositivosFalsos.find((d) => d.id === id)
  if (!dispositivo) {
    throw new Error('El dispositivo no existe')
  }
  dispositivo.activo = false
  return dispositivo
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarDispositivos(filtros) {
  if (usaDatosFalsos) {
    return listarDispositivosFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/dispositivos', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function crearDispositivo(datos) {
  if (usaDatosFalsos) {
    return crearDispositivoFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/dispositivos', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function rotarClaveDispositivo(id) {
  if (usaDatosFalsos) {
    return rotarClaveDispositivoFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/dispositivos/${id}/rotar-clave`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function revocarDispositivo(id) {
  if (usaDatosFalsos) {
    return revocarDispositivoFalso(id)
  }
  try {
    const respuesta = await httpClient.patch(`/dispositivos/${id}/revocar`)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
