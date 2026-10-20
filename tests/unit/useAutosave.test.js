import { describe, it, expect, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { useAutosave } from '../../src/composables/useAutosave'

describe('useAutosave', () => {
  it('saves synchronously on every change, including nested ones', () => {
    const form = reactive({ name: '', items: [] })
    const save = vi.fn()
    useAutosave(form, save)

    form.name = 'a'
    expect(save).toHaveBeenCalledTimes(1)
    form.items.push({ x: 1 })
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('watches several sources together', () => {
    const form = reactive({ name: '' })
    const flag = ref(false)
    const save = vi.fn()
    useAutosave([form, flag], save)

    flag.value = true
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('does not save changes made inside withoutAutosave', () => {
    const form = reactive({ name: '' })
    const save = vi.fn()
    const withoutAutosave = useAutosave(form, save)

    withoutAutosave(() => { form.name = 'loaded' })
    expect(save).not.toHaveBeenCalled()
    form.name = 'typed'
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('resumes saving even if the loading code throws', () => {
    const form = reactive({ name: '' })
    const save = vi.fn()
    const withoutAutosave = useAutosave(form, save)

    expect(() => withoutAutosave(() => { throw new Error('bad data') })).toThrow('bad data')
    form.name = 'typed'
    expect(save).toHaveBeenCalledTimes(1)
  })
})
