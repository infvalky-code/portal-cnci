import httpClient, { usaDatosFalsos } from './httpClient'
import { obtenerDisponibilidad } from './availability'
import { TOLERANCIA_RETARDO_MINUTOS } from '@/config/attendanceConfig'

// Datos falsos en memoria, con la forma exacta de contrato/openapi.yaml.
// GET /asistencia-docentes y POST /asistencia-docentes/manual: propuesta
// pendiente de acordar con Carlitos. Nunca se maneja la plantilla
// biométrica, solo el resultado de la comparación contra la disponibilidad
// declarada (de ahí salen las horas esperadas, ya que el bloque de horario
// todavía no guarda su propia hora).
let checadasFalsas = [
  {
    id: '1',
    docenteId: '1',
    periodoId: '1',
    fecha: '2026-09-21',
    dia: 'Lunes',
    horaEntrada: '08:12',
    horaSalida: '13:00',
    origen: 'Biométrica'
  }
]

const DIAS_POR_INDICE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function diaDeFecha(fecha) {
  return DIAS_POR_INDICE[new Date(`${fecha}T00:00:00`).getDay()]
}

function minutosDesdeMedianoche(horaHHmm) {
  const [horas, minutos] = horaHHmm.split(':').map(Number)
  return horas * 60 + minutos
}

function horasEntre(horaEntrada, horaSalida) {
  return (minutosDesdeMedianoche(horaSalida) - minutosDesdeMedianoche(horaEntrada)) / 60
}

async function horarioEsperadoDocente(docenteId, periodoId, dia) {
  const disponibilidad = await obtenerDisponibilidad(docenteId, periodoId)
  return disponibilidad.bloques.find((b) => b.dia === dia && b.disponible) ?? null
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function clasificar(checada) {
  const esperado = await horarioEsperadoDocente(checada.docenteId, checada.periodoId, checada.dia)
  let estado = 'A tiempo'
  if (esperado?.horaEntrada) {
    const minutosTarde =
      minutosDesdeMedianoche(checada.horaEntrada) - minutosDesdeMedianoche(esperado.horaEntrada)
    estado = minutosTarde > TOLERANCIA_RETARDO_MINUTOS ? 'Retardo' : 'A tiempo'
  }
  return {
    ...checada,
    estado,
    horasTrabajadas: horasEntre(checada.horaEntrada, checada.horaSalida)
  }
}

async function listarAsistenciaDocentesFalso({ periodoId, docenteId, fecha }) {
  await esperar(300)

  let docentesEnAlcance = docenteId ? [docenteId] : [...new Set(checadasFalsas.map((c) => c.docenteId))]

  if (fecha) {
    const dia = diaDeFecha(fecha)
    const resultado = []
    for (const id of docentesEnAlcance) {
      const checada = checadasFalsas.find(
        (c) => c.periodoId === periodoId && c.docenteId === id && c.fecha === fecha
      )
      if (checada) {
        resultado.push(await clasificar(checada))
        continue
      }
      const esperado = await horarioEsperadoDocente(id, periodoId, dia)
      if (esperado) {
        resultado.push({
          id: `falta-${id}-${fecha}`,
          docenteId: id,
          periodoId,
          fecha,
          dia,
          horaEntrada: null,
          horaSalida: null,
          origen: null,
          estado: 'Falta',
          horasTrabajadas: 0
        })
      }
    }
    return resultado
  }

  const enPeriodo = checadasFalsas.filter(
    (c) => c.periodoId === periodoId && (!docenteId || c.docenteId === docenteId)
  )
  return Promise.all(enPeriodo.map(clasificar))
}

async function registrarAsistenciaDocenteManualFalso(datos) {
  await esperar(300)
  const nueva = {
    id: String(Date.now()),
    docenteId: datos.docenteId,
    periodoId: datos.periodoId,
    fecha: datos.fecha,
    dia: datos.dia,
    horaEntrada: datos.horaEntrada,
    horaSalida: datos.horaSalida,
    origen: 'Manual'
  }
  checadasFalsas = checadasFalsas.filter(
    (c) => !(c.docenteId === nueva.docenteId && c.periodoId === nueva.periodoId && c.fecha === nueva.fecha)
  )
  checadasFalsas.push(nueva)
  return clasificar(nueva)
}

function manejarError(error) {
  const mensaje = error.response?.data?.mensaje ?? error.message
  throw new Error(mensaje)
}

export async function listarAsistenciaDocentes(filtros) {
  if (usaDatosFalsos) {
    return listarAsistenciaDocentesFalso(filtros)
  }
  try {
    const respuesta = await httpClient.get('/asistencia-docentes', { params: filtros })
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}

export async function registrarAsistenciaDocenteManual(datos) {
  if (usaDatosFalsos) {
    return registrarAsistenciaDocenteManualFalso(datos)
  }
  try {
    const respuesta = await httpClient.post('/asistencia-docentes/manual', datos)
    return respuesta.data
  } catch (error) {
    manejarError(error)
  }
}
