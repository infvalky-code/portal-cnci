import { describe, it, expect } from 'vitest'
import { calcularCalificacionFinal, calcularIndiceReprobacion } from './gradingCalculations'

const PONDERACION_LICENCIATURA = [15, 25, 25, 35]

describe('calcularCalificacionFinal', () => {
  it('pondera los cuatro parciales según CLAUDE.md (15/25/25/35)', () => {
    const final = calcularCalificacionFinal([8, 8, 8, 8], PONDERACION_LICENCIATURA)
    expect(final).toBeCloseTo(8)
  })

  it('calcula distinto cuando los parciales no son todos iguales', () => {
    const final = calcularCalificacionFinal([6, 7, 8, 9], PONDERACION_LICENCIATURA)
    // 6*0.15 + 7*0.25 + 8*0.25 + 9*0.35 = 0.9 + 1.75 + 2 + 3.15 = 7.8
    expect(final).toBeCloseTo(7.8)
  })

  it('devuelve null si falta capturar algún parcial', () => {
    expect(calcularCalificacionFinal([8, 8, null, 8], PONDERACION_LICENCIATURA)).toBeNull()
    expect(calcularCalificacionFinal([8, 8, undefined, 8], PONDERACION_LICENCIATURA)).toBeNull()
  })
})

describe('calcularIndiceReprobacion', () => {
  it('devuelve null si no hay ninguna calificación capturada', () => {
    expect(calcularIndiceReprobacion([], 7.0)).toBeNull()
  })

  it('calcula el porcentaje por debajo de la mínima aprobatoria', () => {
    // 2 de 4 por debajo de 7.0 = 50%
    expect(calcularIndiceReprobacion([5, 6, 7, 9], 7.0)).toBeCloseTo(50)
  })

  it('da 0% cuando nadie reprueba, incluyendo el caso límite del 5%', () => {
    expect(calcularIndiceReprobacion([7, 8, 9, 10], 7.0)).toBe(0)
  })
})
