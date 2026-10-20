import { computed } from 'vue'
import { useFlowStore } from '../stores/flows'
import { generateYaml, generateJson } from '../utils/generator'
import { downloadFile } from '../utils/download'

export const YAML_FILE_NAME = 'study-papi-config.yaml'
export const DEFAULT_JSON_FILE_NAME = 'papi_config.json'

// The two generated files, kept live from the store, and their downloads
export function useGeneratedFiles() {
  const store = useFlowStore()

  const yaml = computed(() => generateYaml(store.flows, store.configFileName))
  const json = computed(() => generateJson(store.configs))

  return {
    yaml,
    json,
    downloadYaml: () => downloadFile(yaml.value, YAML_FILE_NAME, 'text/yaml'),
    downloadJson: () => downloadFile(json.value, store.configFileName || DEFAULT_JSON_FILE_NAME, 'application/json')
  }
}
