# Portal web — Sistema de Control Escolar CNCI

Portal web del sistema de control escolar de la Universidad CNCI. Lo usan
docentes y personal administrativo; los alumnos no tienen cuenta ni acceso.
Es un proyecto académico (tesina) con entrega final el 24 de noviembre de 2026.

Yo soy Valky, responsable del portal. Brandon lleva el reloj checador y la
integración; Carlitos lleva la API central.

---

## Stack

- Vue 3 (Composition API, `<script setup>`)
- Vite como build tool
- Vuetify 3 como librería de componentes
- Pinia para estado
- Vue Router para rutas
- Axios para HTTP

Las versiones exactas están en `package.json` y son la referencia.

**No agregues dependencias sin preguntarme primero.** Si una tarea parece
necesitar una librería nueva, dímelo y explícame por qué antes de instalarla.

---

## Paleta y tema

| Uso | Color |
| --- | --- |
| Primario | `#1565C0` |
| Éxito | `#2E7D32` |
| Error | `#C62828` |
| Advertencia | `#B8860B` |
| Fondo neutro | `#F5F5F5` |
| Texto | `#333333` |

Los colores se definen **en un solo lugar**, en el tema de Vuetify. Nunca
escribas un color en duro dentro de un componente, ni en `style`, ni en una
clase CSS. La escuela puede cambiar la paleta por sus colores institucionales
y debe poder hacerse sin tocar pantallas.

Significados fijos, iguales en todo el sistema:

- Verde: presente, a tiempo, confirmación
- Rojo: falta, error, acción destructiva
- Amarillo: retardo, pendiente, aviso que no es error

Mientras no haya logo institucional, se usa el nombre del proyecto en texto.

---

## Convenciones

- **Código en inglés**, comentarios y mensajes de commit **en español**.
- Componentes en `PascalCase`, un componente por archivo.
- Vistas de ruta en `src/views/`, componentes reutilizables en `src/components/`.
- Servicios en `src/services/`, uno por dominio (`students.js`, `schedules.js`).
- Nada de abreviaturas inventadas en nombres de variables.

---

## Arquitectura

**Todo dato pasa por `src/services/`.** Nunca pongas una llamada de Axios
directamente en un componente o en una vista.

Cada servicio funciona con un interruptor entre datos falsos y API real,
controlado por variable de entorno. Los datos falsos deben respetar
exactamente la forma acordada en el contrato (`contrato/openapi.yaml`), no
una forma cómoda inventada.

El portal habla **solo con la API central**. Nunca accede a la base de datos.
La base es PostgreSQL y la administra el equipo de BD; el portal no crea ni
modifica tablas.

Si una pantalla necesita un endpoint que no existe en el contrato, **detente
y dímelo**. No inventes la ruta ni el formato de respuesta: todo endpoint
nuevo entra primero al contrato, acordado con Carlitos.

---

## Reglas de interfaz

El portal es **solo para computadora de escritorio**. No hay versión móvil y
no se diseña para celular.

Layout único: menú lateral fijo de 260px con avatar, nombre y rol arriba, y
el área de contenido a la derecha. Las opciones del menú se arman según el
rol de quien inició sesión.

Reglas que no se rompen:

- **Filtros antes de consultar.** El usuario elige qué ver (grupo, fecha,
  periodo) antes de que se pida nada a la API.
- **Paginación de 20 filas.** Nunca traer todos los registros de un jalón.
  Una tabla puede tener miles de filas.
- Las tablas de catálogo siguen todas el mismo patrón: barra de filtros
  arriba, botón de alta a la derecha, columna de acciones al final,
  paginación al pie.
- Nada de pantallas que carguen en blanco: siempre estado de carga y estado
  vacío con un mensaje claro.

---

## Manejo de datos

**Borrar es dar de baja.** No existe eliminación física: se cambia `estatus`
o `activo`. La base no permite borrar catálogos en uso.

**Los errores de la base se muestran al usuario.** Las respuestas 409 y 422
traen un mensaje explicativo desde la base (duplicado, referencia inválida,
regla incumplida). Muéstralo tal cual, en lenguaje claro. Nunca reemplaces
un error real por "algo salió mal" o "error inesperado".

**Los cuatro estados de asistencia se capturan completos:** presente,
ausente, retardo y justificada. La pérdida de detalle ocurre al imprimir un
formato oficial, nunca al capturar.

**Nada de reglas de negocio en duro.** La ponderación de parciales, las
tolerancias de retardo y el número de parciales salen de configuración, no
del código. Hoy viven en un archivo de configuración del portal; después
vendrán de la API.

---

## Git

- Trabajo siempre en mi rama. **Nunca hagas commit en `master`.**
- Commits pequeños: uno por pantalla o por cambio con sentido propio.
- Mensajes de commit en español y en presente: `agrega pantalla de materias`.
- Antes de cualquier commit, muéstrame qué archivos van a entrar.
- **Nunca** `git push --force`, `git reset --hard`, ni borrado de ramas.
- Si aparece un conflicto de merge, **detente y explícamelo en español**
  antes de resolverlo. No lo resuelvas por tu cuenta.

---

## Seguridad

- Nunca subas al repositorio: archivos `.env`, contraseñas, llaves, tokens,
  ni datos reales de la escuela (nombres de alumnos, matrículas, huellas).
- Los datos de prueba son inventados, siempre.
- El token de sesión vive en Pinia, nunca escrito en el código.
- Los datos biométricos son datos personales sensibles por ley. El portal
  no los maneja, pero cualquier pantalla que los mencione debe tratarlos
  con ese criterio.

---

## Decisiones ya tomadas

No vuelvas a proponer estas; ya se discutieron.

- El portal es solo para PC. No se diseña para celular.
- La huella es solo para la checada de los docentes. Los alumnos no se
  enrolan y su asistencia la captura el docente a mano en el portal.
- Los alumnos no tienen cuenta ni acceso al sistema.
- Los roles son: Administrador, Docente y Control escolar.
- El portal no crea tablas. Si falta algo en la base, se propone como script
  al equipo de BD.
- La ponderación de parciales es configuración. En licenciatura hoy es
  15%, 25%, 25% y 35% para los cuatro parciales.
- El armado de horarios no es automático: el sistema sugiere y valida, pero
  la decisión es de Coordinación.
- El registro manual de checada no es un parche: es un camino de primera
  clase, para cuando el lector falle.

---

## Cómo quiero trabajar contigo

- **Una pantalla por sesión.** No me hagas tres a medias.
- Antes de escribir código, dime qué archivos vas a crear o tocar y qué va
  en cada uno. Espera mi visto bueno.
- Si algo del contexto es ambiguo, pregunta en vez de asumir.
- Si te pido algo que contradice este archivo, avísame.
