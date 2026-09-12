import 'vuetify/styles'
import { createVuetify } from 'vuetify'

/**
 * Central Vuetify configuration.
 *
 * Repeated visual conventions belong here instead of being copied into every
 * form component. Individual components can still override these defaults.
 */
export default createVuetify({
  defaults: {
    VTextField: {
      variant: 'outlined',
    },
    VSelect: {
      variant: 'outlined',
    },
    VTextarea: {
      variant: 'outlined',
    },
    VBtn: {
      rounded: 'lg',
    },
  },
  theme: {
    defaultTheme: 'learningLight',
    themes: {
      learningLight: {
        dark: false,
        colors: {
          primary: '#3455DB',
          secondary: '#5F6B7A',
          success: '#2E7D32',
          warning: '#B26A00',
          error: '#C62828',
          background: '#F7F8FA',
          surface: '#FFFFFF',
        },
      },
    },
  },
})
