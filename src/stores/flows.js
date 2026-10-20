import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { createExampleData } from './exampleData'

function uuid() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

export const useFlowStore = defineStore('flows', () => {
  const flows = ref([])
  const configs = ref({})
  const selectedFlowId = ref(null)
  const selectedStepId = ref(null)
  const configFileName = ref('papi_config.json')

  // ── Computed ────────────────────────────────────────────────────────────────

  const selectedFlow = computed(() =>
    flows.value.find(f => f.id === selectedFlowId.value) || null
  )

  const selectedStep = computed(() => {
    if (!selectedFlow.value || !selectedStepId.value) return null
    return selectedFlow.value.steps.find(s => s.id === selectedStepId.value) || null
  })

  const allStepIds = computed(() => {
    if (!selectedFlow.value) return []
    return selectedFlow.value.steps.map(s => s.stepId).filter(Boolean)
  })

  // ── Flow Actions ─────────────────────────────────────────────────────────────

  function createFlow(data = {}) {
    const id = uuid()
    const flow = {
      id,
      name: data.name || `new_flow_${flows.value.length + 1}`,
      version: data.version || 'v0.1',
      method: data.method || 'GET',
      path: data.path || '/new-flow',
      layer: data.layer || 'PAPI',
      start: data.start || '',
      execution: data.execution || null,
      steps: data.steps || []
    }
    flows.value.push(flow)
    selectedFlowId.value = id
    selectedStepId.value = null
    return flow
  }

  function updateFlow(id, patch) {
    const idx = flows.value.findIndex(f => f.id === id)
    if (idx === -1) return
    flows.value[idx] = { ...flows.value[idx], ...patch }
  }

  function deleteFlow(id) {
    const idx = flows.value.findIndex(f => f.id === id)
    if (idx === -1) return
    flows.value.splice(idx, 1)
    if (selectedFlowId.value === id) {
      selectedFlowId.value = flows.value.length > 0 ? flows.value[0].id : null
      selectedStepId.value = null
    }
  }

  function selectFlow(id) {
    selectedFlowId.value = id
    selectedStepId.value = null
  }

  // ── Step Actions ──────────────────────────────────────────────────────────────

  function selectStep(stepId) {
    selectedStepId.value = stepId
  }

  function addStep(data = {}) {
    const flow = selectedFlow.value
    if (!flow) return
    const stepUid = uuid()
    const step = {
      id: stepUid,
      stepId: data.stepId || `step_${flow.steps.length + 1}`,
      type: data.type || 'Operate',
      processor: data.processor || '',
      input: data.input || '',
      configKey: data.configKey || '',
      next: data.next || 'END',
      output: data.output || null,
      onErrorContinue: data.onErrorContinue || null
    }
    // Update the previous last step's next to point to this new step
    if (flow.steps.length > 0) {
      const prev = flow.steps[flow.steps.length - 1]
      if (prev.next === 'END') {
        prev.next = step.stepId
      }
    }
    flow.steps.push(step)
    selectedStepId.value = stepUid
    // Auto-set start if first step
    if (flow.steps.length === 1 && !flow.start) {
      flow.start = step.stepId
    }
    return step
  }

  // Adds a blank Operate step with its own new config, keyed after the step
  // (made unique since configs are shared across flows). The config is saved
  // first so the editor finds it when the new step is selected.
  function addNewStep() {
    const flow = selectedFlow.value
    if (!flow) return
    const stepId = `step_${flow.steps.length + 1}`
    const configKey = uniqueConfigKey(stepId)
    saveConfig(configKey, {
      version: 'v1.0.0',
      name: configKey,
      type: 'lambda_function',
      invocation_type: 'RequestResponse'
    })
    return addStep({ stepId, type: 'Operate', configKey, next: 'END' })
  }

  function updateStep(stepUid, patch) {
    const flow = selectedFlow.value
    if (!flow) return
    const idx = flow.steps.findIndex(s => s.id === stepUid)
    if (idx === -1) return
    const oldStepId = flow.steps[idx].stepId
    flow.steps[idx] = { ...flow.steps[idx], ...patch }
    // If stepId changed, update flow.start if it pointed to old stepId
    if (patch.stepId && patch.stepId !== oldStepId && flow.start === oldStepId) {
      flow.start = patch.stepId
    }
  }

  function deleteStep(stepUid) {
    const flow = selectedFlow.value
    if (!flow) return
    const idx = flow.steps.findIndex(s => s.id === stepUid)
    if (idx === -1) return
    flow.steps.splice(idx, 1)
    if (selectedStepId.value === stepUid) {
      selectedStepId.value = null
    }
  }

  function moveStep(stepUid, direction) {
    const flow = selectedFlow.value
    if (!flow) return
    const idx = flow.steps.findIndex(s => s.id === stepUid)
    if (idx === -1) return
    if (direction === 'up' && idx > 0) {
      const tmp = flow.steps[idx - 1]
      flow.steps[idx - 1] = flow.steps[idx]
      flow.steps[idx] = tmp
    } else if (direction === 'down' && idx < flow.steps.length - 1) {
      const tmp = flow.steps[idx + 1]
      flow.steps[idx + 1] = flow.steps[idx]
      flow.steps[idx] = tmp
    }
  }

  // ── Config Actions ────────────────────────────────────────────────────────────

  function saveConfig(key, data) {
    configs.value[key] = { ...data }
  }

  function deleteConfig(key) {
    delete configs.value[key]
  }

  // Returns base, or base_2, base_3… if taken
  function uniqueConfigKey(base) {
    let key = base
    for (let n = 2; configs.value[key]; n++) key = `${base}_${n}`
    return key
  }

  // Renames a config in place (keeping its position in the output) and
  // repoints every step, in every flow, that referenced the old key
  function renameConfig(oldKey, newKey) {
    if (!configs.value[oldKey] || configs.value[newKey]) return
    configs.value = Object.fromEntries(
      Object.entries(configs.value).map(([k, cfg]) => {
        if (k !== oldKey) return [k, cfg]
        // Keep an auto-generated name in step with the key
        return [newKey, cfg.name === oldKey ? { ...cfg, name: newKey } : cfg]
      })
    )
    for (const flow of flows.value) {
      for (const step of flow.steps) {
        if (step.configKey === oldKey) step.configKey = newKey
      }
    }
  }

  // ── Persist / Import / Export ─────────────────────────────────────────────────

  function exportState() {
    return {
      flows: flows.value,
      configs: configs.value,
      configFileName: configFileName.value
    }
  }

  function importState(state) {
    if (state.flows) flows.value = state.flows
    if (state.configs) configs.value = state.configs
    if (state.configFileName) configFileName.value = state.configFileName
    selectedFlowId.value = flows.value.length > 0 ? flows.value[0].id : null
    selectedStepId.value = null
  }

  function clearAll() {
    flows.value = []
    configs.value = {}
    selectedFlowId.value = null
    selectedStepId.value = null
    configFileName.value = 'papi_config.json'
  }

  // ── Load Example ──────────────────────────────────────────────────────────────

  function loadExample() {
    const example = createExampleData(uuid)
    flows.value = example.flows
    configs.value = example.configs
    selectedFlowId.value = example.flows[0].id
    selectedStepId.value = null
  }

  // ── Auto-persist ──────────────────────────────────────────────────────────────

  watch(
    [flows, configs, configFileName],
    () => {
      try {
        localStorage.setItem(
          'integration-designer-state',
          JSON.stringify(exportState())
        )
      } catch (e) {
        console.warn('Failed to persist state:', e)
      }
    },
    { deep: true }
  )

  return {
    // State
    flows,
    configs,
    selectedFlowId,
    selectedStepId,
    configFileName,
    // Computed
    selectedFlow,
    selectedStep,
    allStepIds,
    // Actions
    createFlow,
    updateFlow,
    deleteFlow,
    selectFlow,
    selectStep,
    addStep,
    addNewStep,
    updateStep,
    deleteStep,
    moveStep,
    saveConfig,
    deleteConfig,
    uniqueConfigKey,
    renameConfig,
    loadExample,
    exportState,
    importState,
    clearAll
  }
})
