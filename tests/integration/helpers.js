import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import { useFlowStore } from '../../src/stores/flows'

// Mounts the whole app with a fresh store, optionally with the example loaded
export async function mountApp({ example = true } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(App, { global: { plugins: [pinia] }, attachTo: document.body })
  const store = useFlowStore()
  if (example) await button(wrapper, 'Load Example').trigger('click')
  await flushPromises()
  return { wrapper, store }
}

export function button(wrapper, text) {
  const match = wrapper.findAll('button').find(b => b.text() === text)
  if (!match) throw new Error(`No button "${text}"`)
  return match
}

// The nth .form-group in the editor whose label is exactly `label`
export function field(wrapper, label, n = 0) {
  const groups = wrapper
    .find('.editor')
    .findAll('.form-group')
    .filter(g => g.find('label').exists() && g.find('label').text().trim() === label)
  if (!groups[n]) throw new Error(`No field "${label}" (#${n})`)
  return groups[n]
}

export const input = (wrapper, label, n) => field(wrapper, label, n).find('input, textarea')

export async function type(wrapper, label, value, n) {
  await input(wrapper, label, n).setValue(value)
  await flushPromises()
}

// Opens a SelectMenu field and clicks the option with this label
export async function pick(wrapper, label, optionLabel, n) {
  const group = field(wrapper, label, n)
  const trigger = group.find('.select-trigger--editable').exists()
    ? group.find('input')
    : group.find('.select-trigger')
  await trigger.trigger(trigger.element.tagName === 'INPUT' ? 'focus' : 'click')
  const option = [...document.querySelectorAll('.select-option')]
    .find(el => el.querySelector('.select-option-label').textContent === optionLabel)
  if (!option) throw new Error(`No option "${optionLabel}" in "${label}"`)
  option.click()
  await flushPromises()
}

export async function selectStep(wrapper, index) {
  await wrapper.findAll('.step-card')[index].trigger('click')
  await flushPromises()
}

async function outputText(wrapper, tab) {
  await wrapper.findAll('.tab-btn').find(b => b.text() === tab).trigger('click')
  await flushPromises()
  return wrapper.find('.output-pre').text()
}

export const yaml = wrapper => outputText(wrapper, 'YAML')
export const json = async wrapper => JSON.parse(await outputText(wrapper, 'JSON'))
