import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Paleta institucional CNCI. Único lugar del código con colores en duro:
// si la escuela cambia de paleta, se cambia aquí y ninguna pantalla se toca.
const cnciLightTheme = {
  dark: false,
  colors: {
    primary: '#1565C0',
    success: '#2E7D32',
    error: '#C62828',
    warning: '#B8860B',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    'on-background': '#333333',
    'on-surface': '#333333',
    // #B8860B es un dorado medio: con texto blanco encima da ~3.3:1 de
    // contraste (no pasa WCAG AA 4.5:1). Con texto negro da ~6.5:1. Se fija
    // aquí, no se toca el color de marca.
    'on-warning': '#000000'
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'cnciLightTheme',
    themes: {
      cnciLightTheme
    }
  }
})
