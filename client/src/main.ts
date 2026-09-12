import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

const app = createApp(App)

// Vue plugins add application-wide capabilities. Order is not important for
// these three plugins here, but each must be installed before `mount()`.
app.use(createPinia())
app.use(router)
app.use(vuetify)

// `#app` is the element from index.html. Vue renders the whole component tree
// inside that one root element.
app.mount('#app')
