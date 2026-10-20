import * as jsYaml from 'js-yaml'
import processorsRaw from './processors.yaml?raw'

// Processor class suggestions per step type, from processors.yaml
export const processorsByType = jsYaml.load(processorsRaw) || {}

export function processorsFor(stepType) {
  return processorsByType[stepType] || []
}
