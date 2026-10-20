import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useFlowStore } from '../../src/stores/flows'

let store

beforeEach(() => {
  setActivePinia(createPinia())
  store = useFlowStore()
})

describe('flows', () => {
  it('creates a flow with defaults and selects it', () => {
    const flow = store.createFlow({ name: 'get_x/v1' })
    expect(flow).toMatchObject({ name: 'get_x/v1', version: 'v0.1', method: 'GET', layer: 'PAPI', steps: [] })
    expect(store.selectedFlow).toBe(store.flows[0])
  })

  it('updates a flow', () => {
    const { id } = store.createFlow()
    store.updateFlow(id, { path: '/changed' })
    expect(store.flows[0].path).toBe('/changed')
  })

  it('deletes a flow and selects the next one', () => {
    const a = store.createFlow({ name: 'a' })
    const b = store.createFlow({ name: 'b' })
    store.selectFlow(a.id)
    store.deleteFlow(a.id)
    expect(store.flows.map(f => f.name)).toEqual(['b'])
    expect(store.selectedFlowId).toBe(b.id)
  })
})

describe('steps', () => {
  beforeEach(() => store.createFlow())

  it('sets the flow start to the first step added', () => {
    store.addStep({ stepId: 'first' })
    expect(store.selectedFlow.start).toBe('first')
  })

  it('links the previous last step to a new step if it pointed to END', () => {
    store.addStep({ stepId: 'a' })
    store.addStep({ stepId: 'b' })
    expect(store.selectedFlow.steps[0].next).toBe('b')
  })

  it('leaves the previous step alone if it already pointed elsewhere', () => {
    store.addStep({ stepId: 'a', next: 'somewhere' })
    store.addStep({ stepId: 'b' })
    expect(store.selectedFlow.steps[0].next).toBe('somewhere')
  })

  it('selects the new step', () => {
    const step = store.addStep({ stepId: 'a' })
    expect(store.selectedStep).toEqual(step)
  })

  it('updates the flow start when the start step is renamed', () => {
    const step = store.addStep({ stepId: 'a' })
    store.updateStep(step.id, { stepId: 'renamed' })
    expect(store.selectedFlow.start).toBe('renamed')
  })

  it('moves steps up and down within bounds', () => {
    store.addStep({ stepId: 'a' })
    const b = store.addStep({ stepId: 'b' })
    store.moveStep(b.id, 'up')
    expect(store.allStepIds).toEqual(['b', 'a'])
    store.moveStep(b.id, 'up')
    expect(store.allStepIds).toEqual(['b', 'a'])
    store.moveStep(b.id, 'down')
    expect(store.allStepIds).toEqual(['a', 'b'])
  })

  it('clears the selection when the selected step is deleted', () => {
    const a = store.addStep({ stepId: 'a' })
    store.deleteStep(a.id)
    expect(store.selectedFlow.steps).toHaveLength(0)
    expect(store.selectedStepId).toBeNull()
  })
})

describe('configs', () => {
  it('generates unique config keys', () => {
    expect(store.uniqueConfigKey('step_1')).toBe('step_1')
    store.saveConfig('step_1', {})
    store.saveConfig('step_1_2', {})
    expect(store.uniqueConfigKey('step_1')).toBe('step_1_3')
  })

  it('renames a config in place, keeping its position', () => {
    store.saveConfig('a', { name: 'custom' })
    store.saveConfig('b', { name: 'b' })
    store.saveConfig('c', { name: 'c' })
    store.renameConfig('b', 'renamed')
    expect(Object.keys(store.configs)).toEqual(['a', 'renamed', 'c'])
  })

  it('renames the config name only when it matched the key', () => {
    store.saveConfig('auto', { name: 'auto' })
    store.saveConfig('manual', { name: 'Manual Name' })
    store.renameConfig('auto', 'auto2')
    store.renameConfig('manual', 'manual2')
    expect(store.configs.auto2.name).toBe('auto2')
    expect(store.configs.manual2.name).toBe('Manual Name')
  })

  it('repoints every step in every flow that used the old key', () => {
    store.createFlow({ name: 'one' })
    store.addStep({ stepId: 'a', configKey: 'shared' })
    store.createFlow({ name: 'two' })
    store.addStep({ stepId: 'b', configKey: 'shared' })
    store.addStep({ stepId: 'c', configKey: 'other' })
    store.saveConfig('shared', {})
    store.saveConfig('other', {})

    store.renameConfig('shared', 'renamed')

    const keys = store.flows.flatMap(f => f.steps.map(s => s.configKey))
    expect(keys).toEqual(['renamed', 'renamed', 'other'])
  })

  it('refuses to rename onto an existing key or from a missing one', () => {
    store.saveConfig('a', { v: 1 })
    store.saveConfig('b', { v: 2 })
    store.renameConfig('a', 'b')
    store.renameConfig('missing', 'c')
    expect(store.configs).toEqual({ a: { v: 1 }, b: { v: 2 } })
  })

  it('stores a copy of the config data', () => {
    const data = { name: 'x' }
    store.saveConfig('k', data)
    data.name = 'changed'
    expect(store.configs.k.name).toBe('x')
  })
})

describe('state', () => {
  it('round-trips through export and import, selecting the first flow', () => {
    store.createFlow({ name: 'a' })
    store.saveConfig('k', { type: 'mock' })
    store.configFileName = 'x.json'
    const state = JSON.parse(JSON.stringify(store.exportState()))

    setActivePinia(createPinia())
    const fresh = useFlowStore()
    fresh.importState(state)
    expect(fresh.flows[0].name).toBe('a')
    expect(fresh.configs).toEqual({ k: { type: 'mock' } })
    expect(fresh.configFileName).toBe('x.json')
    expect(fresh.selectedFlowId).toBe(fresh.flows[0].id)
  })

  it('clears everything', () => {
    store.createFlow()
    store.saveConfig('k', {})
    store.configFileName = 'x.json'
    store.clearAll()
    expect(store.flows).toEqual([])
    expect(store.configs).toEqual({})
    expect(store.selectedFlowId).toBeNull()
    expect(store.configFileName).toBe('papi_config.json')
  })

  it('persists to localStorage on change', async () => {
    store.createFlow({ name: 'persisted' })
    await nextTick()
    const saved = JSON.parse(localStorage.getItem('integration-designer-state'))
    expect(saved.flows[0].name).toBe('persisted')
  })

  it('loads an example whose step configs all exist', () => {
    store.loadExample()
    expect(store.flows.length).toBeGreaterThan(0)
    const keys = store.flows.flatMap(f => f.steps.map(s => s.configKey)).filter(Boolean)
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(store.configs).toHaveProperty([key])
  })
})
