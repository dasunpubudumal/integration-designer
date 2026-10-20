<template>
  <div class="section-header section-header--with-action" style="margin-top:0">
    <span>Config</span>
    <button class="btn btn-ghost btn-sm" title="Create a new config for this step" @click="startNewConfig">+ New Config</button>
  </div>
  <div class="editor-section">
    <div class="form-group">
      <label>Config Key</label>
      <SelectMenu
        ref="keyInput"
        :model-value="keyText"
        :options="Object.keys(store.configs)"
        editable
        placeholder="e.g. get_studies_papi_route"
        @update:model-value="onKeyInput"
        @select="linkExisting"
        @change="onKeyCommit"
      />
      <div v-if="keyTaken" class="hint-text">
        "{{ keyText.trim() }}" already exists. Pick it from the list to use it for this step.
      </div>
      <div v-else-if="!store.selectedStep?.configKey" class="hint-text">
        Type a key to create a config from the fields below, or pick an existing one.
      </div>
      <div v-else class="hint-text">
        Typing renames this config; pick from the list to use another one.
      </div>
    </div>

    <div class="form-group">
      <label>Config Type</label>
      <SelectMenu v-model="form.type" :options="CONFIG_TYPES" @change="onTypeChange" />
    </div>
    <div class="form-group">
      <label>Name</label>
      <input v-model="form.name" placeholder="config name" spellcheck="false" />
    </div>
    <div class="form-group">
      <label>Version</label>
      <input v-model="form.version" placeholder="v1.0.0" />
    </div>

    <component :is="CONFIG_FIELDS[form.type]" v-if="CONFIG_FIELDS[form.type]" :form="form" />

    <div class="config-actions">
      <button v-if="keyText && store.configs[keyText]" class="btn btn-danger btn-sm" @click="deleteConfig">Delete</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useFlowStore } from '../../stores/flows'
import { useAutosave } from '../../composables/useAutosave'
import {
  CONFIG_TYPES, emptyConfigForm, configToForm, formToConfig, switchDefaultsFor, configTypeForProcessor
} from '../../config/configTypes'
import { CONFIG_FIELDS } from './config-fields'
import SelectMenu from '../common/SelectMenu.vue'

const store = useFlowStore()

const form = reactive(emptyConfigForm())
// Text in the Config Key input; may differ from the step's committed key while typing
const keyText = ref('')
// The step's key from before the current typing started, so picking an
// existing config afterwards can undo the live rename
let keyEditOrigin = null
const keyInput = ref(null)

// Edits go to the step's committed key, never to half-typed text
const withoutAutosave = useAutosave(form, () => {
  const key = store.selectedStep?.configKey
  if (key) store.saveConfig(key, formToConfig(form))
})

function fillForm(values) {
  withoutAutosave(() => Object.assign(form, values))
}

function load(step) {
  if (!step) return
  keyText.value = step.configKey || ''
  keyEditOrigin = null
  const cfg = step.configKey && store.configs[step.configKey]
  fillForm(cfg ? configToForm(cfg) : emptyConfigForm())
}

watch(() => store.selectedStep?.id, () => load(store.selectedStep), { immediate: true })

function onTypeChange() {
  Object.assign(form, switchDefaultsFor(form.type))
}

// ── Config key ───────────────────────────────────────────────────────────────
// Typing renames the step's config live (or creates one if the step has none);
// picking from the list switches to an existing config. A key that already
// exists is never overwritten: it waits for a pick or blur.

const keyTaken = computed(() => {
  const key = keyText.value.trim()
  return !!key && key !== store.selectedStep?.configKey && !!store.configs[key]
})

function onKeyInput(value) {
  keyText.value = value
  const step = store.selectedStep
  if (!step) return
  if (keyEditOrigin === null) keyEditOrigin = step.configKey || ''

  const key = value.trim()
  const current = step.configKey
  if (!key || key === current || store.configs[key]) return

  if (current && store.configs[current]) {
    store.renameConfig(current, key)
    if (form.name === current) fillForm({ name: key })
  } else {
    if (!form.name) fillForm({ name: key })
    store.saveConfig(key, formToConfig(form))
    store.updateStep(step.id, { configKey: key })
  }
}

function undoKeyEdit() {
  const step = store.selectedStep
  const origin = keyEditOrigin
  keyEditOrigin = null
  if (!step || origin === null || step.configKey === origin) return
  if (origin) {
    store.renameConfig(step.configKey, origin)
  } else if (step.configKey) {
    // The config was created while typing; drop it
    store.deleteConfig(step.configKey)
    store.updateStep(step.id, { configKey: '' })
  }
}

function linkExisting(key) {
  const step = store.selectedStep
  if (!step || !store.configs[key]) return
  if (key !== step.configKey) {
    undoKeyEdit()
    store.updateStep(step.id, { configKey: key })
  }
  keyEditOrigin = null
  keyText.value = key
  fillForm(configToForm(store.configs[key]))
}

function onKeyCommit() {
  const step = store.selectedStep
  if (!step) return
  if (keyTaken.value) {
    linkExisting(keyText.value.trim())
  } else {
    // Blank (or untouched) input: show the key the step actually has
    keyText.value = step.configKey || ''
    keyEditOrigin = null
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

// Creates and links a config straight away so it shows in the output; the key
// is selected so typing renames it
async function startNewConfig() {
  const step = store.selectedStep
  if (!step) return
  const key = store.uniqueConfigKey(step.stepId || 'config')
  const type = configTypeForProcessor(step.processor) || emptyConfigForm().type
  keyEditOrigin = null
  keyText.value = key
  fillForm({ ...emptyConfigForm(), type, ...switchDefaultsFor(type), name: key })
  store.saveConfig(key, formToConfig(form))
  store.updateStep(step.id, { configKey: key })
  // Wait for the input to show the new key before selecting it
  await nextTick()
  keyInput.value?.focus({ select: true })
}

function deleteConfig() {
  if (!confirm(`Delete config "${keyText.value}"?`)) return
  store.deleteConfig(keyText.value)
  // Detach the step so further edits don't silently re-create the config
  keyText.value = ''
  if (store.selectedStep) store.updateStep(store.selectedStep.id, { configKey: '' })
  fillForm(emptyConfigForm())
}
</script>
