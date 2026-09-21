// Cálculos puros de calificaciones, compartidos por GradesView y ReportsView
// para no duplicar la fórmula de ponderación en cada pantalla.

export function calcularCalificacionFinal(parciales, ponderacion) {
  if (parciales.some((p) => p === null || p === undefined)) return null
  return parciales.reduce((suma, p, i) => suma + (p * ponderacion[i]) / 100, 0)
}

// Porcentaje de calificaciones (ya capturadas, no nulas) por debajo de la
// mínima aprobatoria. null si no hay ninguna capturada todavía.
export function calcularIndiceReprobacion(calificaciones, minimaAprobatoria) {
  if (calificaciones.length === 0) return null
  const reprobados = calificaciones.filter((c) => c < minimaAprobatoria).length
  return (reprobados / calificaciones.length) * 100
}
