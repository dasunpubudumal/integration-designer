import { describe, it, expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountApp, button } from './helpers'

describe('canvas', () => {
  it('shows an empty state until a flow is selected', async () => {
    const { wrapper } = await mountApp({ example: false })
    expect(wrapper.find('.canvas-empty').exists()).toBe(true)
    expect(wrapper.find('.canvas-viewport').exists()).toBe(false)
  })

  it('draws one card per step', async () => {
    const { wrapper, store } = await mountApp()
    expect(wrapper.findAll('.step-card')).toHaveLength(store.selectedFlow.steps.length)
  })

  it('zooms with the mouse wheel and resets from the zoom label', async () => {
    const { wrapper } = await mountApp()
    const viewport = wrapper.find('.canvas-viewport')
    const label = () => wrapper.find('.zoom-reset').text()

    await viewport.trigger('wheel', { deltaY: -300 })
    await flushPromises()
    const zoomedIn = parseInt(label())
    expect(zoomedIn).toBeGreaterThan(100)

    await wrapper.find('.zoom-reset').trigger('click')
    expect(label()).toBe('100%')

    await viewport.trigger('wheel', { deltaY: 300 })
    await flushPromises()
    expect(parseInt(label())).toBeLessThan(100)
  })

  it('clamps zoom between 25% and 250%', async () => {
    const { wrapper } = await mountApp()
    const viewport = wrapper.find('.canvas-viewport')
    for (let i = 0; i < 20; i++) await viewport.trigger('wheel', { deltaY: -500 })
    await flushPromises()
    expect(wrapper.find('.zoom-reset').text()).toBe('250%')
    for (let i = 0; i < 20; i++) await viewport.trigger('wheel', { deltaY: 500 })
    await flushPromises()
    expect(wrapper.find('.zoom-reset').text()).toBe('25%')
  })

  it('keeps the flow header outside the zoomed and scrolled area', async () => {
    const { wrapper } = await mountApp()
    const header = wrapper.find('.flow-meta-row')
    expect(header.text()).toContain('/studies/v1')
    expect(wrapper.find('.canvas-viewport').element.contains(header.element)).toBe(false)
  })

  it('adds steps from the canvas', async () => {
    const { wrapper } = await mountApp()
    const count = wrapper.findAll('.step-card').length
    await button(wrapper, '+ Add Step').trigger('click')
    expect(wrapper.findAll('.step-card')).toHaveLength(count + 1)
  })
})
