import { describe, it, expect } from 'vitest'
import { listarAsistenciaDocentes, registrarAsistenciaDocenteManual } from './teacherAttendance'
import { guardarDisponibilidad } from './availability'

// docenteId '2' (María López Cantú) no trae ninguna checada en el fixture de
// teacherAttendance.js, a propósito: es el caso del bug real que se arregló
// (un docente que nunca ha checado tiene que poder salir "Falta").
const PERIODO_ID = '1'
const DOCENTE_SIN_CHECADAS = '2'
const FECHA_LUNES = '2026-09-21'

describe('listarAsistenciaDocentes', () => {
  it('marca Falta a un docente con horario esperado que nunca ha checado', async () => {
    await guardarDisponibilidad({
      docenteId: DOCENTE_SIN_CHECADAS,
      periodoId: PERIODO_ID,
      niveles: ['Licenciatura'],
      materiaIds: [],
      bloques: [
        { turnoId: '1', dia: 'Lunes', disponible: true, horaEntrada: '08:00', horaSalida: '14:00' }
      ]
    })

    const resultado = await listarAsistenciaDocentes({ periodoId: PERIODO_ID, fecha: FECHA_LUNES })
    const registro = resultado.find((r) => r.docenteId === DOCENTE_SIN_CHECADAS)

    expect(registro).toBeDefined()
    expect(registro.estado).toBe('Falta')
  })

  it('marca Retardo cuando la checada llega después de la tolerancia', async () => {
    await guardarDisponibilidad({
      docenteId: DOCENTE_SIN_CHECADAS,
      periodoId: PERIODO_ID,
      niveles: ['Licenciatura'],
      materiaIds: [],
      bloques: [
        { turnoId: '1', dia: 'Lunes', disponible: true, horaEntrada: '08:00', horaSalida: '14:00' }
      ]
    })

    // Tolerancia es de 10 minutos (attendanceConfig.js); 25 minutos tarde debe ser Retardo.
    const checada = await registrarAsistenciaDocenteManual({
      docenteId: DOCENTE_SIN_CHECADAS,
      periodoId: PERIODO_ID,
      fecha: FECHA_LUNES,
      dia: 'Lunes',
      horaEntrada: '08:25',
      horaSalida: '14:00'
    })

    expect(checada.estado).toBe('Retardo')
  })

  it('marca A tiempo cuando la checada llega dentro de la tolerancia', async () => {
    await guardarDisponibilidad({
      docenteId: DOCENTE_SIN_CHECADAS,
      periodoId: PERIODO_ID,
      niveles: ['Licenciatura'],
      materiaIds: [],
      bloques: [
        { turnoId: '1', dia: 'Lunes', disponible: true, horaEntrada: '08:00', horaSalida: '14:00' }
      ]
    })

    const checada = await registrarAsistenciaDocenteManual({
      docenteId: DOCENTE_SIN_CHECADAS,
      periodoId: PERIODO_ID,
      fecha: FECHA_LUNES,
      dia: 'Lunes',
      horaEntrada: '08:05',
      horaSalida: '14:00'
    })

    expect(checada.estado).toBe('A tiempo')
  })
})
