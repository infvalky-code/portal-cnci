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
