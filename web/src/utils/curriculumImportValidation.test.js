import { describe, it, expect } from 'vitest'
import { evaluarFilasImportacion } from './curriculumImportValidation'

describe('evaluarFilasImportacion', () => {
  it('marca como Válida una fila con clave nueva y datos completos', () => {
    const [fila] = evaluarFilasImportacion([{ clave: 'FI1CTR', nombre: 'Física I' }], new Set())
    expect(fila.estado).toBe('Válida')
    expect(fila.incluir).toBe(true)
  })

  it('detecta una clave que ya existe en el catálogo', () => {
    const clavesExistentes = new Set(['bi1ctr'])
    const [fila] = evaluarFilasImportacion(
      [{ clave: 'BI1CTR', nombre: 'Biología I' }],
      clavesExistentes
    )
    expect(fila.estado).toBe('Clave duplicada en catálogo')
    expect(fila.incluir).toBe(false)
  })

  it('detecta una clave repetida dentro del propio archivo (solo la segunda vez)', () => {
    const filas = evaluarFilasImportacion(
      [
        { clave: 'FI1CTR', nombre: 'Física I' },
        { clave: 'FI1CTR', nombre: 'Física I otra vez' }
      ],
      new Set()
    )
    expect(filas[0].estado).toBe('Válida')
    expect(filas[1].estado).toBe('Clave repetida en el archivo')
  })

  it('marca Faltan datos cuando la clave o el nombre vienen vacíos', () => {
    const filas = evaluarFilasImportacion(
      [
        { clave: '', nombre: 'Sin clave' },
        { clave: 'HI1CTR', nombre: '' }
      ],
      new Set()
    )
    expect(filas[0].estado).toBe('Faltan datos')
    expect(filas[1].estado).toBe('Faltan datos')
  })

  it('la comparación de claves ignora mayúsculas/minúsculas', () => {
    const clavesExistentes = new Set(['ma1ctr'])
    const [fila] = evaluarFilasImportacion(
      [{ clave: 'ma1ctr', nombre: 'Matemáticas I' }],
      clavesExistentes
    )
    expect(fila.estado).toBe('Clave duplicada en catálogo')
  })
})
