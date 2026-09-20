import axios from 'axios'

// Instancia única de Axios. Todo servicio de dominio (students.js, schedules.js, ...)
// pasa por aquí en vez de llamar a Axios directamente desde un componente o vista.
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

// Interruptor entre datos falsos y API real, controlado por variable de entorno.
// Cada servicio de dominio lo consulta para decidir si responde con datos
// falsos (con la forma exacta del contrato) o llama a httpClient.
export const usaDatosFalsos = import.meta.env.VITE_USE_FAKE_DATA === 'true'

export default httpClient
