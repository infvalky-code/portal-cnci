import { defineStore } from 'pinia'

// Token y datos de sesión viven solo en memoria (Pinia), nunca en el código.
// El login real contra la API llega en una sesión aparte.
export const useSessionStore = defineStore('session', {
  state: () => ({
    token: null,
    usuario: null,
    rol: null
  }),
  getters: {
    estaAutenticado: (state) => Boolean(state.token)
  },
  actions: {
    iniciarSesion({ token, usuario, rol }) {
      this.token = token
      this.usuario = usuario
      this.rol = rol
    },
    cerrarSesion() {
      this.token = null
      this.usuario = null
      this.rol = null
    }
  }
})
