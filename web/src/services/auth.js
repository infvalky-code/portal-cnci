import httpClient, { usaDatosFalsos } from './httpClient'

// Usuarios de prueba inventados, uno por rol. Nada real de la escuela.
// Endpoint /auth/login: propuesta pendiente de acordar con Carlitos (ver contrato/openapi.yaml).
const USUARIOS_FALSOS = [
  { usuario: 'admin', contrasena: '1234', nombre: 'Valky Administrador', rol: 'Administrador' },
  { usuario: 'docente1', contrasena: '1234', nombre: 'Juan Docente', rol: 'Docente' },
  { usuario: 'control1', contrasena: '1234', nombre: 'Ana Control', rol: 'Control escolar' }
]

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function iniciarSesionFalso(usuario, contrasena) {
  await esperar(400)
  const encontrado = USUARIOS_FALSOS.find((u) => u.usuario === usuario)
  if (!encontrado || encontrado.contrasena !== contrasena) {
    throw new Error('Usuario o contraseña inválidos')
  }
  return {
    token: `token-falso-${encontrado.usuario}`,
    usuario: { nombre: encontrado.nombre, rol: encontrado.rol }
  }
}

async function iniciarSesionReal(usuario, contrasena) {
  try {
    const respuesta = await httpClient.post('/auth/login', { usuario, contrasena })
    return respuesta.data
  } catch (error) {
    const mensaje = error.response?.data?.mensaje ?? error.message
    throw new Error(mensaje)
  }
}

export function iniciarSesion(usuario, contrasena) {
  return usaDatosFalsos ? iniciarSesionFalso(usuario, contrasena) : iniciarSesionReal(usuario, contrasena)
}
