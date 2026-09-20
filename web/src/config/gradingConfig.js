// Ponderación de parciales: configuración, no regla de negocio en duro.
// Licenciatura confirmada (CLAUDE.md, decisión ya tomada). Bachillerato es
// el mismo valor como placeholder: sigue sin confirmarse con la escuela
// ("¿La ponderación de parciales es la misma en bachillerato que en
// licenciatura?", pregunta abierta documentada en el proyecto).
export const PONDERACION_POR_NIVEL = {
  Licenciatura: [15, 25, 25, 35],
  Bachillerato: [15, 25, 25, 35]
}

export const CALIFICACION_MINIMA_APROBATORIA = 7.0
