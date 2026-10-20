import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SelectMenu from '../../src/components/common/SelectMenu.vue'

const options = [
  { value: 'route', label: 'Route', color: '#3b82f6' },
  { value: 'operate', label: 'Operate' },
  { value: 'transform', label: 'Transform' }
]

function mountMenu(props = {}) {
  return mount(SelectMenu, {
    props: { modelValue: 'operate', options, ...props },
    attachTo: document.body
  })
}

// The menu is teleported to <body>, outside the wrapper
const menu = () => document.querySelector('.select-popover')
const optionLabels = () => [...document.querySelectorAll('.select-option-label')].map(el => el.textContent)

describe('SelectMenu (fixed list)', () => {
  it('shows the selected option label', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.select-value').text()).toBe('Operate')
  })

  it('shows the placeholder when nothing matches', () => {
    const wrapper = mountMenu({ modelValue: '', placeholder: 'Pick one' })
    expect(wrapper.find('.select-value').text()).toBe('Pick one')
  })

  it('accepts plain string options', () => {
    const wrapper = mountMenu({ options: ['GET', 'POST'], modelValue: 'POST' })
    expect(wrapper.find('.select-value').text()).toBe('POST')
  })

  it('opens on click and marks the selected option', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.select-trigger').trigger('click')
    expect(optionLabels()).toEqual(['Route', 'Operate', 'Transform'])
    expect(document.querySelector('.select-option--selected').textContent).toContain('Operate')
    expect(document.querySelectorAll('.select-check')).toHaveLength(1)
  })

  it('emits update, select and change when an option is picked, then closes', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.select-trigger').trigger('click')
    document.querySelectorAll('.select-option')[2].click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['transform']])
    expect(wrapper.emitted('select')).toEqual([['transform']])
    expect(wrapper.emitted('change')).toEqual([['transform']])
    expect(menu()).toBeNull()
  })

  it('supports arrow keys and Enter', async () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('.select-trigger')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    expect(menu()).not.toBeNull()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await trigger.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['transform']])
  })

  it('wraps around with the arrow keys', async () => {
    const wrapper = mountMenu({ modelValue: 'route' })
    const trigger = wrapper.find('.select-trigger')
    await trigger.trigger('click')
    await trigger.trigger('keydown', { key: 'ArrowUp' })
    await trigger.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['transform']])
  })

  it('closes on Escape without emitting', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.select-trigger').trigger('click')
    await wrapper.find('.select-trigger').trigger('keydown', { key: 'Escape' })
    expect(menu()).toBeNull()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes when clicking outside', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.select-trigger').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(menu()).toBeNull()
  })

  it('shows a colour dot for options that have one', async () => {
    const wrapper = mountMenu({ modelValue: 'route' })
    expect(wrapper.find('.select-trigger .select-dot').exists()).toBe(true)
  })
})

describe('SelectMenu (editable)', () => {
  const suggestions = ['END', 'study_router', 'study_connector', 'notify']

  function mountEditable(props = {}) {
    return mountMenu({ editable: true, modelValue: '', options: suggestions, ...props })
  }

  it('emits every keystroke and filters the suggestions', async () => {
    const wrapper = mountEditable()
    const input = wrapper.find('input')
    await input.setValue('study')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['study'])
    expect(optionLabels()).toEqual(['study_router', 'study_connector'])
  })

  it('shows every suggestion when focused, before typing', async () => {
    const wrapper = mountEditable({ modelValue: 'notify' })
    await wrapper.find('input').trigger('focus')
    expect(optionLabels()).toEqual(suggestions)
  })

  it('emits change on blur, not while typing', async () => {
    const wrapper = mountEditable()
    const input = wrapper.find('input')
    await input.setValue('free text')
    expect(wrapper.emitted('change')).toBeUndefined()
    await input.trigger('blur')
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('emits select but not change when a suggestion is picked', async () => {
    const wrapper = mountEditable()
    await wrapper.find('input').trigger('focus')
    document.querySelectorAll('.select-option')[1].click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('select')).toEqual([['study_router']])
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('picks the first filtered suggestion with Enter', async () => {
    const wrapper = mountEditable()
    const input = wrapper.find('input')
    await input.setValue('conn')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toEqual([['study_connector']])
  })

  it('can be focused with its text selected', async () => {
    const wrapper = mountEditable({ modelValue: 'step_3' })
    wrapper.vm.focus({ select: true })
    const input = wrapper.find('input').element
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6])
  })
})
