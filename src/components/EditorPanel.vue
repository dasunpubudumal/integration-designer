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
            <input v-model="flowForm.name" @blur="saveFlow" spellcheck="false" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Method</label>
              <select v-model="flowForm.method" @change="saveFlow">
                <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Version</label>
              <input v-model="flowForm.version" @blur="saveFlow" />
            </div>
          </div>
          <div class="form-group">
            <label>Path</label>
            <input v-model="flowForm.path" @blur="saveFlow" spellcheck="false" />
          </div>
          <div class="form-group">
            <label>Layer</label>
            <input v-model="flowForm.layer" @blur="saveFlow" />
          </div>
          <div class="form-group">
            <label>Start Step</label>
            <select v-model="flowForm.start" @change="saveFlow">
              <option value="">-- Select --</option>
              <option v-for="sid in store.allStepIds" :key="sid" :value="sid">{{ sid }}</option>
            </select>
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
              <input v-model="flowForm.execution.type" @blur="saveFlow" placeholder="batch" />
            </div>
            <div class="form-group">
              <label>Batch Input Path</label>
              <input v-model="flowForm.execution.batch_input_path" @blur="saveFlow" placeholder="body.Records" />
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
            <input v-model="stepForm.stepId" @blur="saveStep" spellcheck="false" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <select v-model="stepForm.type" @change="onTypeChange">
                <option v-for="t in stepTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Next</label>
              <input
                v-model="stepForm.next"
                list="next-options"
                @blur="saveStep"
                placeholder="END or step ID"
                spellcheck="false"
              />
              <datalist id="next-options">
                <option value="END" />
                <option v-for="sid in store.allStepIds" :key="sid" :value="sid" />
              </datalist>
            </div>
          </div>

          <div class="form-group">
            <label>Processor</label>
            <input
              v-model="stepForm.processor"
              list="processor-options"
              @blur="saveStep"
              spellcheck="false"
              placeholder="processor class path"
            />
            <datalist id="processor-options">
              <option v-for="p in processorSuggestions" :key="p" :value="p" />
            </datalist>
          </div>

          <div class="form-group">
            <label>Input Expression</label>
            <textarea
              v-model="stepForm.input"
              @blur="saveStep"
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
              <input v-model="stepForm.outputValue" @blur="saveStep" placeholder="@" />
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
                  @blur="saveStep"
                  rows="2"
                  placeholder="JMESPath expression"
                  spellcheck="false"
                />
              </div>
              <div class="form-group">
                <label>Next (if true)</label>
                <input
                  v-model="check.next"
                  list="next-options-check"
                  @blur="saveStep"
                  spellcheck="false"
                />
                <datalist id="next-options-check">
                  <option value="END" />
                  <option v-for="sid in store.allStepIds" :key="sid" :value="sid" />
                </datalist>
              </div>
            </div>
          </div>
          <div v-else class="hint-text">No output checks.</div>

          <!-- On-error-continue -->
          <div class="subsection-header">On-Error-Continue</div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="stepForm.oecEnabled" @change="saveStep" style="width:auto;margin-right:5px" />
              Enable on-error-continue
            </label>
          </div>
          <template v-if="stepForm.oecEnabled">
            <div class="form-group">
              <label>Exceptions (comma-separated)</label>
              <input
                v-model="stepForm.oecExceptions"
                @blur="saveStep"
                placeholder="Exception, RuntimeError"
                spellcheck="false"
              />
            </div>
            <div class="form-group">
              <label>Next on error</label>
              <input
                v-model="stepForm.oecNext"
                list="next-options-oec"
                @blur="saveStep"
                spellcheck="false"
              />
              <datalist id="next-options-oec">
                <option value="END" />
                <option v-for="sid in store.allStepIds" :key="sid" :value="sid" />
              </datalist>
            </div>
          </template>
        </div>

        <!-- ── Config Section ──────────────────────────────────────────── -->
        <div class="section-header" style="margin-top:0">Config</div>
        <div class="editor-section">
          <div class="form-group">
            <label>Config Key</label>
            <input
              v-model="configKey"
              list="config-keys-list"
              @blur="onConfigKeyBlur"
              placeholder="e.g. get_studies_papi_route"
              spellcheck="false"
            />
            <datalist id="config-keys-list">
              <option v-for="k in Object.keys(store.configs)" :key="k" :value="k" />
            </datalist>
          </div>

          <div class="form-group">
            <label>Config Type</label>
            <select v-model="configForm.type" @change="onConfigTypeChange">
              <option v-for="t in configTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
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
                <input v-model="rule.destination" list="next-options-rule" spellcheck="false" />
                <datalist id="next-options-rule">
                  <option v-for="sid in store.allStepIds" :key="sid" :value="sid" />
                </datalist>
              </div>
            </div>
          </template>

          <!-- lambda_function fields -->
          <template v-else-if="configForm.type === 'lambda_function'">
            <div class="form-group">
              <label>Invocation Type</label>
              <select v-model="configForm.invocation_type">
                <option value="RequestResponse">RequestResponse</option>
                <option value="Event">Event</option>
              </select>
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
              <select v-model="configForm.auth_type">
                <option value="OAUTH_CLIENT_CREDENTIALS">OAUTH_CLIENT_CREDENTIALS</option>
                <option value="BEARER_TOKEN">BEARER_TOKEN</option>
                <option value="BASIC">BASIC</option>
                <option value="NONE">NONE</option>
              </select>
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

          <!-- dynamodb fields -->
          <template v-else-if="configForm.type === 'dynamodb'">
            <div class="form-group">
              <label>Operation</label>
              <select v-model="configForm.operation">
                <option value="PUT_ITEM">PUT_ITEM</option>
                <option value="GET_ITEM">GET_ITEM</option>
                <option value="DELETE_ITEM">DELETE_ITEM</option>
                <option value="UPDATE_ITEM">UPDATE_ITEM</option>
              </select>
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
            <button class="btn btn-primary" @click="handleSaveConfig">Save Config</button>
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
import { ref, reactive, watch, computed } from 'vue'
import { useFlowStore } from '../stores/flows'
import * as jsYaml from 'js-yaml'
import processorsRaw from '../config/processors.yaml?raw'

const store = useFlowStore()

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const stepTypes = ['Route', 'Operate', 'Transform']

const configTypes = [
  { value: 'route', label: 'Route' },
  { value: 'lambda_function', label: 'Lambda Function' },
  { value: 'http_connector', label: 'HTTP Connector' },
  { value: 'mapping', label: 'Mapping (JMESPath)' },
  { value: 'sqs', label: 'SQS' },
  { value: 'dynamodb', label: 'DynamoDB' },
  { value: 'mock', label: 'Mock' }
]

const processorsByType = jsYaml.load(processorsRaw)

const processorSuggestions = computed(() => {
  return processorsByType[stepForm.type] || []
})

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

watch(
  () => store.selectedFlow,
  flow => syncFlowForm(flow),
  { immediate: true, deep: false }
)

// When selected flow id changes, re-sync
watch(
  () => store.selectedFlowId,
  () => syncFlowForm(store.selectedFlow)
)

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
  saveFlow()
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
  if (step.configKey && store.configs[step.configKey]) {
    loadConfigForm(store.configs[step.configKey])
  } else {
    resetConfigForm()
  }
}

watch(
  () => store.selectedStep,
  step => syncStepForm(step),
  { immediate: true, deep: false }
)

watch(
  () => store.selectedStepId,
  () => syncStepForm(store.selectedStep)
)

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
    configKey: configKey.value,
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
  saveStep()
}

// Output checks
function addOutputCheck() {
  const name = `check_${Object.keys(stepForm.outputChecks).length + 1}`
  stepForm.outputChecks[name] = { predicate: '', next: 'END' }
}

function removeOutputCheck(name) {
  delete stepForm.outputChecks[name]
  saveStep()
}

function renameCheck(oldName, newName) {
  if (!newName || newName === oldName) return
  const val = stepForm.outputChecks[oldName]
  delete stepForm.outputChecks[oldName]
  stepForm.outputChecks[newName] = val
  saveStep()
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
function onConfigKeyBlur() {
  // Update the step's configKey in the store immediately
  if (store.selectedStep) {
    store.updateStep(store.selectedStep.id, { configKey: configKey.value })
  }
  // If config key maps to existing config, load it
  if (configKey.value && store.configs[configKey.value]) {
    loadConfigForm(store.configs[configKey.value])
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
  // sqs
  configForm.operation = cfg.operation || 'send_message'
  configForm.queue_name = cfg.queue_name || ''
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
  configForm.operation = 'send_message'
  configForm.queue_name = ''
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

    case 'sqs':
      return { ...base, operation: configForm.operation, queue_name: configForm.queue_name, channels: {} }

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

function handleSaveConfig() {
  if (!configKey.value.trim()) {
    alert('Please enter a config key.')
    return
  }
  const data = buildConfigData()
  store.saveConfig(configKey.value.trim(), data)
  // Also update step's configKey
  saveStep()
}

function handleDeleteConfig() {
  if (!confirm(`Delete config "${configKey.value}"?`)) return
  store.deleteConfig(configKey.value)
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
