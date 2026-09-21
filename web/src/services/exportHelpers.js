import * as XLSX from 'xlsx'

// Exportación a Excel real (xlsx). Solo generamos archivos desde nuestros
// propios datos, nunca leemos un .xlsx ajeno, así que las vulnerabilidades
// conocidas de la librería (que aplican a parsear archivos de terceros) no
// tocan este uso.
export function exportarExcel(nombreArchivo, filas) {
  const hoja = XLSX.utils.json_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}

// PDF: sin librería nueva, se usa el diálogo de impresión del navegador
// (Ctrl+P > Guardar como PDF) sobre la vista imprimible de la pantalla.
export function imprimir() {
  window.print()
}

// Lectura de archivos que trae el usuario (importación de mapa curricular).
// A diferencia de exportarExcel, aquí sí se parsea un archivo de terceros
// con XLSX.read(), que es justo el vector de la vulnerabilidad conocida de
// la librería (Prototype Pollution / ReDoS). Decisión explícita de Valky:
// se acepta el riesgo para poder leer .xlsx además de .csv.
export async function leerHojaDeArchivo(archivo) {
  const nombre = archivo.name.toLowerCase()
  let filas
  if (nombre.endsWith('.csv')) {
    const texto = await archivo.text()
    filas = texto
      .split(/\r?\n/)
      .filter((linea) => linea.trim() !== '')
      .map((linea) => {
        const [clave, nombreMateria] = linea.split(',')
        return { clave: (clave ?? '').trim(), nombre: (nombreMateria ?? '').trim() }
      })
  } else {
    const buffer = await archivo.arrayBuffer()
    const libro = XLSX.read(buffer, { type: 'array' })
    const primeraHoja = libro.Sheets[libro.SheetNames[0]]
    const filasCrudas = XLSX.utils.sheet_to_json(primeraHoja, { header: ['clave', 'nombre'] })
    filas = filasCrudas.map((fila) => ({
      clave: String(fila.clave ?? '').trim(),
      nombre: String(fila.nombre ?? '').trim()
    }))
  }

  // Descarta el renglón de encabezado si el archivo trae uno (clave/nombre
  // literales) y las filas totalmente vacías.
  return filas.filter(
    (fila) =>
      (fila.clave !== '' || fila.nombre !== '') &&
      !(fila.clave.toLowerCase() === 'clave' && fila.nombre.toLowerCase() === 'nombre')
  )
}
