import { watch } from 'vue'

// Saves `source` (a reactive form, or an array of refs/reactives) on every
// change, synchronously, so the output panel updates as the user types.
// Code that fills the form from the store must run inside the returned
// withoutAutosave(), or it writes stale or default values back.
export function useAutosave(source, save) {
  let paused = false

  watch(source, () => {
    if (!paused) save()
  }, { deep: true, flush: 'sync' })

  return function withoutAutosave(fn) {
    paused = true
    try {
      fn()
    } finally {
      paused = false
    }
  }
}
