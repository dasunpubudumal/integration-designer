<template>
  <div class="editor-inner">
    <!-- No flow selected -->
    <div v-if="!store.selectedFlow" class="editor-empty">
      <p>Select a flow to edit its properties.</p>
    </div>

    <template v-else>
      <!-- ── Flow Properties (when no step selected) ─────────────────────── -->
      <template v-if="!store.selectedStep">
        <div class="section-header">Flow Properties</div>
        <div class="editor-section">
          <div class="form-group">
            <label>Flow Name</label>
            <input v-model="flowForm.name" spellcheck="false" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Method</label>
              <SelectMenu v-model="flowForm.method" :options="methods" />
            </div>
            <div class="form-group">
              <label>Version</label>
              <input v-model="flowForm.version" />
            </div>
          </div>
          <div class="form-group">
            <label>Path</label>
            <input v-model="flowForm.path" spellcheck="false" />
          </div>
          <div class="form-group">
            <label>Layer</label>
            <input v-model="flowForm.layer" />
          </div>
          <div class="form-group">
            <label>Start Step</label>
            <SelectMenu
              v-model="flowForm.start"
              :options="[{ value: '', label: 'None' }, ...store.allStepIds]"
              placeholder="Select a step"
            />
          </div>

          <!-- Execution block -->
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="hasExecution" @change="onExecutionToggle" style="width:auto;margin-right:5px" />
              Batch Execution
            </label>
          </div>
          <template v-if="hasExecution && flowForm.execution">
            <div class="form-group">
              <label>Execution Type</label>
              <input v-model="flowForm.execution.type" placeholder="batch" />
            </div>
            <div class="form-group">
              <label>Batch Input Path</label>
              <input v-model="flowForm.execution.batch_input_path" placeholder="body.Records" />
            </div>
          </template>
        </div>
      </template>

      <!-- ── Step Properties ─────────────────────────────────────────────── -->
      <template v-else>
        <div class="section-header" style="display:flex;align-items:center;justify-content:space-between">
          <span>Step Properties</span>
          <button class="btn btn-ghost btn-sm" @click="store.selectStep(null)">&#8592; Flow</button>
        </div>
        <div class="editor-section">
          <div class="form-group">
            <label>Step ID</label>
            <input v-model="stepForm.stepId" spellcheck="false" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <SelectMenu v-model="stepForm.type" :options="stepTypeOptions" @change="onTypeChange" />
            </div>
            <div class="form-group">
              <label>Next</label>
              <SelectMenu
                v-model="stepForm.next"
                :options="nextOptions"
                editable
                placeholder="END or step ID"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Processor</label>
            <SelectMenu
              v-model="stepForm.processor"
              :options="processorSuggestions"
              editable
              placeholder="processor class path"
            />
          </div>

          <div class="form-group">
            <label>Input Expression</label>
            <textarea
              v-model="stepForm.input"
              rows="2"
              placeholder="e.g. step.init.input  or  {body: step.x.output}"
              spellcheck="false"
            />
          </div>

          <!-- Output Checks -->
          <div class="subsection-header">
            Output Checks
            <button class="btn btn-ghost btn-sm" @click="addOutputCheck">+ Check</button>
          </div>
          <div v-if="Object.keys(stepForm.outputChecks).length > 0">
            <div class="form-group">
              <label>Output Value Expression</label>
              <input v-model="stepForm.outputValue" placeholder="@" />
            </div>
            <div
              v-for="(check, name) in stepForm.outputChecks"
              :key="name"
              class="check-block"
            >
              <div class="check-header">
                <input
                  class="check-name-input"
                  :value="name"
                  @blur="renameCheck(name, $event.target.value)"
                  placeholder="check name"
                  spellcheck="false"
                />
                <button class="btn btn-ghost btn-sm" style="color:var(--red)" @click="removeOutputCheck(name)">✕</button>
              </div>
              <div class="form-group" style="margin-top:4px">
                <label>Predicate</label>
                <textarea
                  v-model="check.predicate"
                  rows="2"
                  placeholder="JMESPath expression"
                  spellcheck="false"
                />
              </div>
              <div class="form-group">
                <label>Next (if true)</label>
                <SelectMenu v-model="check.next" :options="nextOptions" editable placeholder="END or step ID" />
              </div>
            </div>
          </div>
          <div v-else class="hint-text">No output checks.</div>

          <!-- On-error-continue -->
          <div class="subsection-header">On-Error-Continue</div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="stepForm.oecEnabled" style="width:auto;margin-right:5px" />
              Enable on-error-continue
            </label>
          </div>
          <template v-if="stepForm.oecEnabled">
            <div class="form-group">
              <label>Exceptions (comma-separated)</label>
              <input
                v-model="stepForm.oecExceptions"
                placeholder="Exception, RuntimeError"
                spellcheck="false"
              />
            </div>
            <div class="form-group">
              <label>Next on error</label>
              <SelectMenu v-model="stepForm.oecNext" :options="nextOptions" editable placeholder="END or step ID" />
            </div>
          </template>
        </div>

        <!-- ── Config Section ──────────────────────────────────────────── -->
        <div class="section-header" style="margin-top:0;display:flex;align-items:center;justify-content:space-between">
          <span>Config</span>
          <button class="btn btn-ghost btn-sm" title="Create a new config for this step" @click="startNewConfig">+ New Config</button>
        </div>
        <div class="editor-section">
          <div class="form-group">
            <label>Config Key</label>
            <SelectMenu
              ref="configKeyInput"
              :model-value="configKey"
              :options="Object.keys(store.configs)"
              editable
              placeholder="e.g. get_studies_papi_route"
              @update:model-value="onConfigKeyInput"
              @select="linkExistingConfig"
              @change="onConfigKeyCommit"
            />
            <div v-if="configKeyTaken" class="hint-text">
              "{{ configKey.trim() }}" already exists. Pick it from the list to use it for this step.
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
            <SelectMenu v-model="configForm.type" :options="configTypes" @change="onConfigTypeChange" />
          </div>

          <div class="form-group">
            <label>Name</label>
            <input v-model="configForm.name" placeholder="config name" spellcheck="false" />
          </div>
          <div class="form-group">
            <label>Version</label>
            <input v-model="configForm.version" placeholder="v1.0.0" />
          </div>

          <!-- route fields -->
          <template v-if="configForm.type === 'route'">
            <div class="subsection-header">
              Rules
              <button class="btn btn-ghost btn-sm" @click="addRule">+ Rule</button>
            </div>
            <div
              v-for="(rule, ruleName) in configForm.rules"
              :key="ruleName"
              class="check-block"
            >
              <div class="check-header">
                <input
                  class="check-name-input"
                  :value="ruleName"
                  @blur="renameRule(ruleName, $event.target.value)"
                  placeholder="rule name"
                  spellcheck="false"
                />
                <button class="btn btn-ghost btn-sm" style="color:var(--red)" @click="removeRule(ruleName)">✕</button>
              </div>
              <div class="form-row" style="margin-top:4px">
                <div class="form-group">
                  <label>Field</label>
                  <input v-model="rule.field" placeholder="httpMethod" spellcheck="false" />
                </div>
                <div class="form-group">
                  <label>Value</label>
                  <input v-model="rule.value" placeholder="GET" />
                </div>
              </div>
              <div class="form-group">
                <label>Destination</label>
                <SelectMenu v-model="rule.destination" :options="store.allStepIds" editable placeholder="step ID" />
              </div>
            </div>
          </template>

          <!-- lambda_function fields -->
          <template v-else-if="configForm.type === 'lambda_function'">
            <div class="form-group">
              <label>Invocation Type</label>
              <SelectMenu v-model="configForm.invocation_type" :options="['RequestResponse', 'Event']" />
            </div>
          </template>

          <!-- http_connector fields -->
          <template v-else-if="configForm.type === 'http_connector'">
            <div class="form-group">
              <label>Provider Key</label>
              <input v-model="configForm.provider_key" placeholder="notification_api" spellcheck="false" />
            </div>
            <div class="subsection-header">Auth Config</div>
            <div class="form-group">
              <label>Auth Type</label>
              <SelectMenu
                v-model="configForm.auth_type"
                :options="['OAUTH_CLIENT_CREDENTIALS', 'BEARER_TOKEN', 'BASIC', 'NONE']"
              />
            </div>
            <div class="form-group">
              <label>Token URL</label>
              <input v-model="configForm.token_url" placeholder="env:TOKEN_URL" spellcheck="false" />
            </div>
            <div class="form-group">
              <label>Grant Type</label>
              <input v-model="configForm.grant_type" placeholder="client_credentials" />
            </div>
            <div class="form-group">
              <label>Client ID</label>
              <input v-model="configForm.client_id" placeholder="sm:inthub-env:ENV-api.client_id" spellcheck="false" />
            </div>
            <div class="form-group">
              <label>Client Secret</label>
              <input v-model="configForm.client_secret" placeholder="sm:inthub-env:ENV-api.client_secret" spellcheck="false" />
            </div>
            <div class="form-group">
              <label>Scope</label>
              <input v-model="configForm.scope" placeholder="resource/action" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Max Retries</label>
                <input v-model.number="configForm.max_retries" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>Timeout (ms)</label>
                <input v-model.number="configForm.timeout" type="number" min="0" />
              </div>
            </div>
          </template>

          <!-- mapping fields -->
          <template v-else-if="configForm.type === 'mapping'">
            <div class="form-group">
              <label>Engine</label>
              <input value="jmespath" readonly style="color:var(--text-muted)" />
            </div>
            <div class="form-group">
              <label>Spec (JMESPath expression)</label>
              <textarea v-model="configForm.spec" rows="4" placeholder="{request: body}" spellcheck="false" />
            </div>
          </template>

          <!-- schema fields -->
          <template v-else-if="configForm.type === 'schema'">
            <div class="form-group">
              <label>Spec Engine</label>
              <input value="jsonschema" readonly style="color:var(--text-muted)" />
            </div>
            <div class="form-group">
              <label>Spec S3 URI</label>
              <input v-model="configForm.spec_s3_uri" placeholder="http://schema-registry.sanger.ac.uk/v1/" spellcheck="false" />
            </div>
            <div class="form-group">
              <label>Spec (JSON Schema)</label>
              <textarea
                v-model="configForm.spec"
                rows="12"
                placeholder='{"$schema": "https://json-schema.org/draft/2020-12/schema", "type": "object"}'
                spellcheck="false"
              />
              <div v-if="schemaSpecError" class="hint-text" style="color:var(--red)">
                Invalid JSON, so it is output as typed: {{ schemaSpecError }}
              </div>
            </div>
          </template>

          <!-- sqs fields -->
          <template v-else-if="configForm.type === 'sqs'">
            <div class="form-group">
              <label>Operation</label>
              <input v-model="configForm.operation" placeholder="send_message" />
            </div>
            <div class="form-group">
              <label>Queue Name</label>
              <input v-model="configForm.queue_name" placeholder="env:MY_QUEUE_NAME" spellcheck="false" />
            </div>
          </template>

          <!-- sns_publish fields -->
          <template v-else-if="configForm.type === 'sns_publish'">
            <div class="form-row">
              <div class="form-group">
                <label>Operation</label>
                <input v-model="configForm.operation" placeholder="publish" />
              </div>
              <div class="form-group">
                <label>Max Retries</label>
                <input v-model.number="configForm.max_retries" type="number" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Topic ARN</label>
              <input v-model="configForm.topic_arn" placeholder="env:MY_SNS_TOPIC_ARN" spellcheck="false" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Message Structure</label>
                <input v-model="configForm.message_structure" placeholder="json" />
              </div>
              <div class="form-group">
                <label>Input Path</label>
                <input v-model="configForm.input_path" placeholder="@" spellcheck="false" />
              </div>
            </div>
            <div class="subsection-header">
              Message Attributes
              <button class="btn btn-ghost btn-sm" @click="addMessageAttribute">+ Attribute</button>
            </div>
            <div
              v-for="(attr, idx) in configForm.message_attributes"
              :key="idx"
              class="check-block"
            >
              <div class="check-header">
                <input
                  v-model="attr.name"
                  class="check-name-input"
                  placeholder="attribute name"
                  spellcheck="false"
                />
                <button class="btn btn-ghost btn-sm" style="color:var(--red)" @click="removeMessageAttribute(idx)">✕</button>
              </div>
              <div class="form-row" style="margin-top:4px">
                <div class="form-group">
                  <label>Path</label>
                  <input v-model="attr.path" placeholder="messageVersion" spellcheck="false" />
                </div>
                <div class="form-group">
                  <label>Default</label>
                  <input v-model="attr.default" placeholder="v1.0.0" />
                </div>
              </div>
              <div class="form-group">
                <label>Data Type</label>
                <SelectMenu v-model="attr.data_type" :options="['String', 'String.Array', 'Number', 'Binary']" />
              </div>
            </div>
            <div v-if="configForm.message_attributes.length === 0" class="hint-text">No message attributes.</div>
          </template>

          <!-- dynamodb fields -->
          <template v-else-if="configForm.type === 'dynamodb'">
            <div class="form-group">
              <label>Operation</label>
              <SelectMenu
                v-model="configForm.operation"
                :options="['PUT_ITEM', 'GET_ITEM', 'DELETE_ITEM', 'UPDATE_ITEM']"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Partition Key</label>
                <input v-model="configForm.partition_key" placeholder="pk" />
              </div>
              <div class="form-group">
                <label>Sort Key</label>
                <input v-model="configForm.sort_key" placeholder="sk" />
              </div>
            </div>
            <div class="form-group">
              <label>Table Name</label>
              <input v-model="configForm.table_name" placeholder="env:TABLE_NAME" spellcheck="false" />
            </div>
            <div class="form-group">
              <label>Region</label>
              <input v-model="configForm.region_name" placeholder="eu-west-2" />
            </div>
          </template>

          <!-- mock fields -->
          <template v-else-if="configForm.type === 'mock'">
            <div class="form-group">
              <label>Mock File Path</label>
              <input v-model="configForm.file" placeholder="mocks/response.json" spellcheck="false" />
            </div>
          </template>

          <div class="config-actions">
            <button
              v-if="configKey && store.configs[configKey]"
              class="btn btn-danger btn-sm"
              @click="handleDeleteConfig"
            >Delete</button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, nextTick } from 'vue'
import { useFlowStore } from '../stores/flows'
import * as jsYaml from 'js-yaml'
import processorsRaw from '../config/processors.yaml?raw'
import SelectMenu from './SelectMenu.vue'
import { STEP_TYPES, stepTypeColor } from '../utils/stepTypes'

const store = useFlowStore()

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const stepTypeOptions = STEP_TYPES.map(t => ({ value: t, label: t, color: stepTypeColor(t) }))

const configTypes = [
  { value: 'route', label: 'Route' },
  { value: 'lambda_function', label: 'Lambda Function' },
  { value: 'http_connector', label: 'HTTP Connector' },
  { value: 'mapping', label: 'Mapping (JMESPath)' },
  { value: 'schema', label: 'Schema Validation' },
  { value: 'sqs', label: 'SQS' },
  { value: 'sns_publish', label: 'SNS Publish' },
  { value: 'dynamodb', label: 'DynamoDB' },
  { value: 'mock', label: 'Mock' }
]

const processorsByType = jsYaml.load(processorsRaw)

const nextOptions = computed(() => ['END', ...store.allStepIds])

const processorSuggestions = computed(() => {
  return processorsByType[stepForm.type] || []
})

// ── Autosave ───────────────────────────────────────────────────────────────
// Form edits are written to the store as they happen so the output panel
// updates live. Loading a form from the store must not write back.

let autosavePaused = false

function withoutAutosave(fn) {
  autosavePaused = true
  try {
    fn()
  } finally {
    autosavePaused = false
  }
}

// ── Flow form ──────────────────────────────────────────────────────────────

const flowForm = reactive({
  name: '',
  version: '',
  method: 'GET',
  path: '',
  layer: '',
  start: '',
  execution: null
})

const hasExecution = ref(false)

function syncFlowForm(flow) {
  if (!flow) return
  flowForm.name = flow.name || ''
  flowForm.version = flow.version || ''
  flowForm.method = flow.method || 'GET'
  flowForm.path = flow.path || ''
  flowForm.layer = flow.layer || ''
  flowForm.start = flow.start || ''
  if (flow.execution) {
    hasExecution.value = true
    flowForm.execution = { ...flow.execution }
  } else {
    hasExecution.value = false
    flowForm.execution = null
  }
}

// Re-sync when the selection changes (also on returning from a step, since
// renaming a step can change flow.start). Saving replaces the store object,
// so watching the object itself would re-sync on every keystroke.
watch(
  () => [store.selectedFlow?.id, store.selectedStepId],
  () => withoutAutosave(() => syncFlowForm(store.selectedFlow)),
  { immediate: true }
)

watch([flowForm, hasExecution], () => {
  if (!autosavePaused) saveFlow()
}, { deep: true, flush: 'sync' })

function saveFlow() {
  if (!store.selectedFlow) return
  store.updateFlow(store.selectedFlow.id, {
    name: flowForm.name,
    version: flowForm.version,
    method: flowForm.method,
    path: flowForm.path,
    layer: flowForm.layer,
    start: flowForm.start,
    execution: hasExecution.value ? { ...flowForm.execution } : null
  })
}

function onExecutionToggle() {
  if (hasExecution.value) {
    flowForm.execution = { type: 'batch', batch_input_path: '' }
  } else {
    flowForm.execution = null
  }
}

// ── Step form ──────────────────────────────────────────────────────────────

const stepForm = reactive({
  stepId: '',
  type: 'Operate',
  processor: '',
  input: '',
  next: 'END',
  outputChecks: {},
  outputValue: '@',
  oecEnabled: false,
  oecExceptions: '',
  oecNext: ''
})

const configKey = ref('')
let keyEditOrigin = null
const configForm = reactive({
  type: 'lambda_function',
  name: '',
  version: 'v1.0.0',
  invocation_type: 'RequestResponse',
  provider_key: '',
  auth_type: 'OAUTH_CLIENT_CREDENTIALS',
  token_url: '',
  grant_type: 'client_credentials',
  client_id: '',
  client_secret: '',
  scope: '',
  max_retries: 3,
  timeout: 30000,
  spec: '',
  spec_s3_uri: '',
  topic_arn: '',
  message_structure: 'json',
  message_attributes: [],
  input_path: '@',
  operation: 'send_message',
  queue_name: '',
  partition_key: 'pk',
  sort_key: 'sk',
  table_name: '',
  region_name: 'eu-west-2',
  file: '',
  rules: {}
})

function syncStepForm(step) {
  if (!step) return
  stepForm.stepId = step.stepId || ''
  stepForm.type = step.type || 'Operate'
  stepForm.processor = step.processor || ''
  stepForm.input = step.input || ''
  stepForm.next = step.next || 'END'

  // Output checks
  if (step.output && step.output.checks) {
    stepForm.outputChecks = JSON.parse(JSON.stringify(step.output.checks))
    stepForm.outputValue = step.output.value || '@'
  } else {
    stepForm.outputChecks = {}
    stepForm.outputValue = '@'
  }

  // On-error-continue
  if (step.onErrorContinue && step.onErrorContinue.enabled) {
    stepForm.oecEnabled = true
    stepForm.oecExceptions = (step.onErrorContinue.exceptions || []).join(', ')
    stepForm.oecNext = step.onErrorContinue.next || ''
  } else {
    stepForm.oecEnabled = false
    stepForm.oecExceptions = ''
    stepForm.oecNext = ''
  }

  // Config
  configKey.value = step.configKey || ''
  keyEditOrigin = null
  if (step.configKey && store.configs[step.configKey]) {
    loadConfigForm(store.configs[step.configKey])
  } else {
    resetConfigForm()
  }
}

watch(
  () => store.selectedStep?.id,
  () => withoutAutosave(() => syncStepForm(store.selectedStep)),
  { immediate: true }
)

watch(stepForm, () => {
  if (!autosavePaused) saveStep()
}, { deep: true, flush: 'sync' })

// Edits go to the step's committed config key (the key input commits on blur,
// so typing a new key doesn't create a config for every prefix)
watch(configForm, () => {
  const key = store.selectedStep?.configKey
  if (!autosavePaused && key) store.saveConfig(key, buildConfigData())
}, { deep: true, flush: 'sync' })

function saveStep() {
  if (!store.selectedStep) return
  const outputHasChecks = Object.keys(stepForm.outputChecks).length > 0
  const output = outputHasChecks
    ? { value: stepForm.outputValue, checks: JSON.parse(JSON.stringify(stepForm.outputChecks)) }
    : null

  const exceptions = stepForm.oecExceptions
    ? stepForm.oecExceptions.split(',').map(s => s.trim()).filter(Boolean)
    : []

  store.updateStep(store.selectedStep.id, {
    stepId: stepForm.stepId,
    type: stepForm.type,
    processor: stepForm.processor,
    input: stepForm.input,
    next: stepForm.next,
    output,
    onErrorContinue: stepForm.oecEnabled
      ? { enabled: true, exceptions, next: stepForm.oecNext }
      : null
  })
}

function onTypeChange() {
  // Suggest a processor when type changes if current is blank
  if (!stepForm.processor) {
    const suggestions = processorsByType[stepForm.type]
    if (suggestions && suggestions.length > 0) {
      stepForm.processor = suggestions[0]
    }
  }
}

// Output checks
function addOutputCheck() {
  const name = `check_${Object.keys(stepForm.outputChecks).length + 1}`
  stepForm.outputChecks[name] = { predicate: '', next: 'END' }
}

function removeOutputCheck(name) {
  delete stepForm.outputChecks[name]
}

function renameCheck(oldName, newName) {
  if (!newName || newName === oldName) return
  const val = stepForm.outputChecks[oldName]
  delete stepForm.outputChecks[oldName]
  stepForm.outputChecks[newName] = val
}

// Rules
function addRule() {
  const name = `rule_${Object.keys(configForm.rules).length + 1}`
  configForm.rules[name] = { field: '', value: '', destination: '' }
}

function removeRule(name) {
  delete configForm.rules[name]
}

function renameRule(oldName, newName) {
  if (!newName || newName === oldName) return
  const val = configForm.rules[oldName]
  delete configForm.rules[oldName]
  configForm.rules[newName] = val
}

// Config key autocomplete
// Config key editing. Typing renames the step's config live (or creates one if
// the step has none); picking from the list switches to an existing config.
// keyEditOrigin (declared with configKey) remembers the key from before typing
// started, so switching to an existing config afterwards can undo the rename.

const configKeyTaken = computed(() => {
  const key = configKey.value.trim()
  return !!key && key !== store.selectedStep?.configKey && !!store.configs[key]
})

function onConfigKeyInput(value) {
  configKey.value = value
  const step = store.selectedStep
  if (!step) return
  if (keyEditOrigin === null) keyEditOrigin = step.configKey || ''

  const key = value.trim()
  const current = step.configKey
  // Empty or clashing keys wait for a pick or blur rather than clobbering anything
  if (!key || key === current || store.configs[key]) return

  if (current && store.configs[current]) {
    store.renameConfig(current, key)
    if (configForm.name === current) withoutAutosave(() => { configForm.name = key })
  } else {
    if (!configForm.name) withoutAutosave(() => { configForm.name = key })
    store.saveConfig(key, buildConfigData())
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

function linkExistingConfig(key) {
  const step = store.selectedStep
  if (!step || !store.configs[key]) return
  if (key !== step.configKey) {
    undoKeyEdit()
    store.updateStep(step.id, { configKey: key })
  }
  keyEditOrigin = null
  configKey.value = key
  withoutAutosave(() => loadConfigForm(store.configs[key]))
}

function onConfigKeyCommit() {
  const step = store.selectedStep
  if (!step) return
  const key = configKey.value.trim()
  if (configKeyTaken.value) {
    linkExistingConfig(key)
  } else {
    // Blank (or untouched) input: show the key the step actually has
    configKey.value = step.configKey || ''
    keyEditOrigin = null
  }
}

function loadConfigForm(cfg) {
  configForm.type = cfg.type || 'lambda_function'
  configForm.name = cfg.name || ''
  configForm.version = cfg.version || 'v1.0.0'
  // lambda
  configForm.invocation_type = cfg.invocation_type || 'RequestResponse'
  // http_connector
  configForm.provider_key = cfg.provider_key || ''
  if (cfg.raw_auth_config) {
    configForm.auth_type = cfg.raw_auth_config.auth_type || 'OAUTH_CLIENT_CREDENTIALS'
    configForm.token_url = cfg.raw_auth_config.token_url || ''
    configForm.grant_type = cfg.raw_auth_config.grant_type || 'client_credentials'
    configForm.client_id = cfg.raw_auth_config.client_id || ''
    configForm.client_secret = cfg.raw_auth_config.client_secret || ''
    configForm.scope = cfg.raw_auth_config.scope || ''
  }
  configForm.max_retries = cfg.max_retries !== undefined ? cfg.max_retries : 3
  configForm.timeout = cfg.timeout !== undefined ? cfg.timeout : 30000
  // mapping
  configForm.spec = cfg.spec || ''
  configForm.spec_s3_uri = cfg.spec_s3_uri || ''
  // The schema spec is stored as a compact JSON string; pretty-print it for editing
  if (cfg.type === 'schema' && configForm.spec) {
    try {
      configForm.spec = JSON.stringify(JSON.parse(configForm.spec), null, 2)
    } catch {
      // Leave invalid JSON as-is
    }
  }
  // sqs
  configForm.operation = cfg.operation || 'send_message'
  configForm.queue_name = cfg.queue_name || ''
  // sns_publish
  configForm.topic_arn = cfg.sns_config?.topic_arn || ''
  configForm.message_structure = cfg.sns_config?.message_structure || 'json'
  configForm.message_attributes = JSON.parse(JSON.stringify(cfg.sns_config?.message_attributes || []))
  configForm.input_path = cfg.input_path || '@'
  // dynamodb
  configForm.partition_key = cfg.partition_key || 'pk'
  configForm.sort_key = cfg.sort_key || 'sk'
  configForm.table_name = cfg.table_name || ''
  configForm.region_name = cfg.region_name || 'eu-west-2'
  // mock
  configForm.file = cfg.file || ''
  // route rules
  configForm.rules = cfg.rules ? JSON.parse(JSON.stringify(cfg.rules)) : {}
}

function resetConfigForm() {
  configForm.type = 'lambda_function'
  configForm.name = ''
  configForm.version = 'v1.0.0'
  configForm.invocation_type = 'RequestResponse'
  configForm.provider_key = ''
  configForm.auth_type = 'OAUTH_CLIENT_CREDENTIALS'
  configForm.token_url = ''
  configForm.grant_type = 'client_credentials'
  configForm.client_id = ''
  configForm.client_secret = ''
  configForm.scope = ''
  configForm.max_retries = 3
  configForm.timeout = 30000
  configForm.spec = ''
  configForm.spec_s3_uri = ''
  configForm.operation = 'send_message'
  configForm.queue_name = ''
  configForm.topic_arn = ''
  configForm.message_structure = 'json'
  configForm.message_attributes = []
  configForm.input_path = '@'
  configForm.partition_key = 'pk'
  configForm.sort_key = 'sk'
  configForm.table_name = ''
  configForm.region_name = 'eu-west-2'
  configForm.file = ''
  configForm.rules = {}
}

function onConfigTypeChange() {
  // Reset type-specific fields when type changes
  if (configForm.type === 'route') {
    if (Object.keys(configForm.rules).length === 0) {
      configForm.rules = {}
    }
  }
  // Operation is shared across types; switch to the new type's default
  const defaultOperation = { sqs: 'send_message', sns_publish: 'publish', dynamodb: 'PUT_ITEM' }[configForm.type]
  if (defaultOperation) configForm.operation = defaultOperation
}

// SNS message attributes
function addMessageAttribute() {
  configForm.message_attributes.push({ name: '', path: '', default: '', data_type: 'String' })
}

function removeMessageAttribute(idx) {
  configForm.message_attributes.splice(idx, 1)
}

function buildConfigData() {
  const base = {
    version: configForm.version || 'v1.0.0',
    name: configForm.name || '',
    type: configForm.type
  }

  switch (configForm.type) {
    case 'route':
      return { ...base, rules: JSON.parse(JSON.stringify(configForm.rules)) }

    case 'lambda_function':
      return { ...base, invocation_type: configForm.invocation_type }

    case 'http_connector':
      return {
        ...base,
        provider_key: configForm.provider_key,
        raw_auth_config: {
          auth_type: configForm.auth_type,
          token_url: configForm.token_url,
          grant_type: configForm.grant_type,
          client_id: configForm.client_id,
          client_secret: configForm.client_secret,
          scope: configForm.scope
        },
        max_retries: configForm.max_retries,
        timeout: configForm.timeout
      }

    case 'mapping':
      return { ...base, engine: 'jmespath', spec: configForm.spec }

    case 'schema':
      return {
        version: base.version,
        name: base.name,
        spec_engine: 'jsonschema',
        type: base.type,
        spec_s3_uri: configForm.spec_s3_uri,
        spec: compactJson(configForm.spec)
      }

    case 'sqs':
      return { ...base, operation: configForm.operation, queue_name: configForm.queue_name, channels: {} }

    case 'sns_publish':
      return {
        ...base,
        max_retries: configForm.max_retries,
        operation: configForm.operation,
        sns_config: {
          topic_arn: configForm.topic_arn,
          message_structure: configForm.message_structure,
          message_attributes: JSON.parse(JSON.stringify(configForm.message_attributes))
        },
        input_path: configForm.input_path
      }

    case 'dynamodb':
      return {
        ...base,
        operation: configForm.operation,
        partition_key: configForm.partition_key,
        sort_key: configForm.sort_key,
        table_name: configForm.table_name,
        region_name: configForm.region_name
      }

    case 'mock':
      return { ...base, file: configForm.file }

    default:
      return base
  }
}

const schemaSpecError = computed(() => {
  if (configForm.type !== 'schema' || !configForm.spec.trim()) return ''
  try {
    JSON.parse(configForm.spec)
    return ''
  } catch (e) {
    return e.message
  }
})

// Store the schema as a single-line JSON string, as the runtime expects
function compactJson(text) {
  try {
    return JSON.stringify(JSON.parse(text))
  } catch {
    return text
  }
}

// Guess the config type from the step's processor, e.g. ...SNSConnector → sns_publish
const configTypeByProcessor = [
  [/router/i, 'route'],
  [/lambda/i, 'lambda_function'],
  [/http/i, 'http_connector'],
  [/sqs/i, 'sqs'],
  [/sns/i, 'sns_publish'],
  [/dynamodb/i, 'dynamodb'],
  [/jmespath/i, 'mapping']
]

const configKeyInput = ref(null)

async function startNewConfig() {
  const step = store.selectedStep
  if (!step) return
  // Create and link it straight away so it shows in the output; the key is
  // selected so typing renames it
  const key = store.uniqueConfigKey(step.stepId || 'config')
  keyEditOrigin = null
  configKey.value = key
  withoutAutosave(() => {
    resetConfigForm()
    const match = configTypeByProcessor.find(([re]) => re.test(stepForm.processor))
    if (match) {
      configForm.type = match[1]
      onConfigTypeChange()
    }
    configForm.name = key
  })
  store.saveConfig(key, buildConfigData())
  store.updateStep(step.id, { configKey: key })
  // Wait for the input to show the new key before selecting it
  await nextTick()
  configKeyInput.value?.focus({ select: true })
}

function handleDeleteConfig() {
  if (!confirm(`Delete config "${configKey.value}"?`)) return
  store.deleteConfig(configKey.value)
  // Detach the step so further edits don't silently re-create the config
  configKey.value = ''
  if (store.selectedStep) store.updateStep(store.selectedStep.id, { configKey: '' })
  withoutAutosave(resetConfigForm)
}
</script>

<style scoped>
.editor-inner {
  padding-bottom: 24px;
}

.editor-empty {
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.editor-section {
  padding: 12px 16px 16px;
  border-bottom: 1px solid var(--border);
}

.subsection-header {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 14px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.check-block {
  background: var(--surface3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.check-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.check-name-input {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 3px 6px;
}

.config-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  align-items: center;
}

.hint-text {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: 4px;
}
</style>
