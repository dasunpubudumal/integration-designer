import * as jsYaml from 'js-yaml'

/**
 * Generates the YAML DSL string from flows data.
 * The flow name is emitted as a null-valued key alongside other sibling properties.
 */
export function generateYaml(flows, configFileName = 'papi_config.json') {
  if (!flows || flows.length === 0) {
    return '# No flows defined yet\nflows: []\n'
  }

  const flowObjects = flows.map(flow => {
    const flowObj = {}

    // The flow name is the first key with null value (produces `flowname:` in YAML)
    flowObj[flow.name] = null
    flowObj.version = flow.version || 'v0.1'
    flowObj.method = flow.method || 'GET'
    flowObj.path = flow.path || '/'
    flowObj.layer = flow.layer || 'PAPI'

    // Optional execution block
    if (flow.execution && flow.execution.type) {
      const exec = { type: flow.execution.type }
      if (flow.execution.batch_input_path) {
        exec.batch_input_path = flow.execution.batch_input_path
      }
      flowObj.execution = exec
    }

    flowObj.start = flow.start || ''

    // Build steps array
    const steps = (flow.steps || []).map(step => {
      const stepObj = {}
      stepObj.type = step.type || 'Operate'
      stepObj.id = step.stepId || step.id

      stepObj.processor = step.processor || ''

      // Optional input
      if (step.input && step.input.trim()) {
        stepObj.input = step.input.trim()
      }

      // Config reference
      if (step.configKey) {
        stepObj.config = `ref:config/${configFileName}@${step.configKey}`
      }

      // Output with checks
      if (step.output && step.output.checks && Object.keys(step.output.checks).length > 0) {
        const outputObj = {}
        if (step.output.value) {
          outputObj.value = step.output.value
        }
        const checksObj = {}
        for (const [checkName, checkData] of Object.entries(step.output.checks)) {
          if (checkName && checkData) {
            checksObj[checkName] = {
              predicate: checkData.predicate || '',
              next: checkData.next || ''
            }
          }
        }
        if (Object.keys(checksObj).length > 0) {
          outputObj.checks = checksObj
        }
        flowObj.output = outputObj
        stepObj.output = outputObj
      }

      // Next
      stepObj.next = step.next || 'END'

      // On-error-continue
      if (step.onErrorContinue && step.onErrorContinue.enabled) {
        const oec = {}
        if (step.onErrorContinue.exceptions && step.onErrorContinue.exceptions.length > 0) {
          oec.exceptions = step.onErrorContinue.exceptions
        }
        if (step.onErrorContinue.next) {
          oec.next = step.onErrorContinue.next
        }
        stepObj['on-error-continue'] = oec
      }

      return stepObj
    })

    flowObj.steps = steps

    return flowObj
  })

  const doc = { flows: flowObjects }
  return jsYaml.dump(doc, { lineWidth: -1, noRefs: true })
}

/**
 * Generates the companion JSON config file content.
 * configs is a flat object: { [configKey]: configData }
 */
export function generateJson(configs) {
  if (!configs || Object.keys(configs).length === 0) {
    return '{}'
  }
  return JSON.stringify(configs, null, 4)
}
