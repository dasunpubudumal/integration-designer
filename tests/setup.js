import { afterEach, beforeEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// jsdom doesn't implement these browser APIs the app relies on
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub
Element.prototype.scrollIntoView = function () {}
Element.prototype.setPointerCapture = function () {}
Element.prototype.releasePointerCapture = function () {}

beforeEach(() => {
  localStorage.clear()
  // Confirmation dialogs (Load Example, delete) always accept
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

// Unmounting also removes anything a component teleported to <body>
enableAutoUnmount(afterEach)

afterEach(() => {
  vi.restoreAllMocks()
})
