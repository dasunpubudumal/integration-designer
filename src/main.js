import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useFlowStore } from './stores/flows'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Load persisted state before mounting
const store = useFlowStore(pinia)
const saved = localStorage.getItem('integration-designer-state')
if (saved) {
  try {
    store.importState(JSON.parse(saved))
  } catch (e) {
    console.warn('Failed to load saved state:', e)
  }
}

app.mount('#app')
