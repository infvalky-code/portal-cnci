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
    'on-surface': '#333333'
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
