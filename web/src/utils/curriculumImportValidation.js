// Validación pura de la vista previa de importación de mapa curricular
// (CurriculumImportView.vue): marca cada fila como válida o el motivo por
// el que no se puede importar, sin tocar el DOM ni la API.

export function evaluarFilasImportacion(filas, clavesExistentes) {
  const vistasEnArchivo = new Set()
  return filas.map((fila) => {
    let estado = 'Válida'
    if (!fila.clave || !fila.nombre) {
      estado = 'Faltan datos'
    } else if (clavesExistentes.has(fila.clave.toLowerCase())) {
      estado = 'Clave duplicada en catálogo'
    } else if (vistasEnArchivo.has(fila.clave.toLowerCase())) {
      estado = 'Clave repetida en el archivo'
    }
    if (fila.clave) {
      vistasEnArchivo.add(fila.clave.toLowerCase())
    }
    return { ...fila, estado, incluir: estado === 'Válida' }
  })
}
