import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 2.5

// Mouse-wheel zoom (anchored at the cursor) and drag-to-pan for a scrollable
// viewport containing a scaled element. The template needs three refs:
//   viewportEl  the scroll container
//   sizerEl     reserves the scaled footprint so scrollbars cover it
//   contentEl   the unscaled content, drawn with transform: scale(zoom)
// and binds the returned handlers to the viewport's wheel/pointer events.
// `ignorePanFrom` is a selector for elements where a drag shouldn't pan.
export function useCanvasZoomPan({ ignorePanFrom = 'button, input, textarea, select, a' } = {}) {
  const viewportEl = ref(null)
  const sizerEl = ref(null)
  const contentEl = ref(null)
  const zoom = ref(1)
  const viewportWidth = ref(0)
  const contentHeight = ref(0)
  const panStart = ref(null)

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target === viewportEl.value) viewportWidth.value = entry.contentRect.width
      else contentHeight.value = entry.target.offsetHeight
    }
  })
  onBeforeUnmount(() => resizeObserver.disconnect())

  // The elements may come and go (e.g. only exist while a flow is open)
  watch([viewportEl, contentEl], (els, oldEls = []) => {
    oldEls.forEach(el => el && resizeObserver.unobserve(el))
    els.forEach(el => el && resizeObserver.observe(el))
  })

  // Zoom around the cursor: keep the content point under the pointer fixed on screen
  async function onWheel(e) {
    if (!sizerEl.value) return
    e.preventDefault()

    const oldZoom = zoom.value
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * Math.exp(-e.deltaY * 0.0015)))
    if (newZoom === oldZoom) return

    const before = sizerEl.value.getBoundingClientRect()
    const contentX = (e.clientX - before.left) / oldZoom
    const contentY = (e.clientY - before.top) / oldZoom

    zoom.value = newZoom
    await nextTick()

    const after = sizerEl.value.getBoundingClientRect()
    viewportEl.value.scrollLeft += after.left + contentX * newZoom - e.clientX
    viewportEl.value.scrollTop += after.top + contentY * newZoom - e.clientY
  }

  function onPointerDown(e) {
    if (e.button !== 0 || !sizerEl.value) return
    if (e.target.closest(ignorePanFrom)) return
    e.preventDefault()
    viewportEl.value.setPointerCapture(e.pointerId)
    panStart.value = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewportEl.value.scrollLeft,
      scrollTop: viewportEl.value.scrollTop
    }
  }

  function onPointerMove(e) {
    if (!panStart.value) return
    viewportEl.value.scrollLeft = panStart.value.scrollLeft - (e.clientX - panStart.value.x)
    viewportEl.value.scrollTop = panStart.value.scrollTop - (e.clientY - panStart.value.y)
  }

  function onPointerUp(e) {
    if (!panStart.value) return
    viewportEl.value.releasePointerCapture(e.pointerId)
    panStart.value = null
  }

  return {
    viewportEl, sizerEl, contentEl,
    zoom, viewportWidth, contentHeight,
    panStart,
    resetZoom: () => { zoom.value = 1 },
    onWheel, onPointerDown, onPointerMove, onPointerUp
  }
}
