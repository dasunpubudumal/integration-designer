import { describe, it, expect, vi } from 'vitest'
import { mountApp, selectStep, pick, type, input } from './helpers'

// Pretend processors.yaml lists nothing, so this doesn't depend on which step
// types currently have suggestions
vi.mock('../../src/config/processors', () => ({
  processorsByType: {},
  processorsFor: () => []
}))

describe('processor suggestions', () => {
  it('says so when a step type has no suggested processors', async () => {
    const { wrapper } = await mountApp()
    await selectStep(wrapper, 1)
    await pick(wrapper, 'Type', 'Validate')
    await type(wrapper, 'Processor', '')
    await input(wrapper, 'Processor').trigger('focus')

    expect(document.querySelector('.select-empty').textContent)
      .toBe('No suggested processors for Validate steps yet. Type a class path.')
  })
})
