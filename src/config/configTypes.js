// Registry of config types: how each JSON config block is edited and generated.
//
// The editor keeps one flat form object (see emptyConfigForm) shared by every
// type, so values like name, version and max_retries survive switching types.
// Each type then describes:
//   value / label     the JSON `type` and the Config Type dropdown label
//   load(cfg)         form fields read from a stored config block
//   build(form, base) the config block generated from the form, in output key
//                     order; `base` is { version, name, type }
//   switchDefaults    form values applied when the user switches to this type
//   processor         pattern on the step's processor class that implies this type
//
// The form component for each type lives in components/editor/config-fields/.

const clone = value => JSON.parse(JSON.stringify(value))

// Store the schema as a single-line JSON string, as the runtime expects;
// invalid JSON is kept exactly as typed
export function compactJson(text) {
  try {
    return JSON.stringify(JSON.parse(text))
  } catch {
    return text
  }
}

function prettyJson(text) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

export const CONFIG_TYPES = [
  {
    value: 'route',
    label: 'Route',
    processor: /router/i,
    load: cfg => ({ rules: clone(cfg.rules || {}) }),
    build: (f, base) => ({ ...base, rules: clone(f.rules) })
  },
  {
    value: 'lambda_function',
    label: 'Lambda Function',
    processor: /lambda/i,
    load: cfg => ({ invocation_type: cfg.invocation_type || 'RequestResponse' }),
    build: (f, base) => ({ ...base, invocation_type: f.invocation_type })
  },
  {
    value: 'http_connector',
    label: 'HTTP Connector',
    processor: /http/i,
    load: cfg => {
      const auth = cfg.raw_auth_config || {}
      return {
        provider_key: cfg.provider_key || '',
        auth_type: auth.auth_type || 'OAUTH_CLIENT_CREDENTIALS',
        token_url: auth.token_url || '',
        grant_type: auth.grant_type || 'client_credentials',
        client_id: auth.client_id || '',
        client_secret: auth.client_secret || '',
        scope: auth.scope || '',
        max_retries: cfg.max_retries ?? 3,
        timeout: cfg.timeout ?? 30000
      }
    },
    build: (f, base) => ({
      ...base,
      provider_key: f.provider_key,
      raw_auth_config: {
        auth_type: f.auth_type,
        token_url: f.token_url,
        grant_type: f.grant_type,
        client_id: f.client_id,
        client_secret: f.client_secret,
        scope: f.scope
      },
      max_retries: f.max_retries,
      timeout: f.timeout
    })
  },
  {
    value: 'mapping',
    label: 'Mapping (JMESPath)',
    processor: /jmespath/i,
    load: cfg => ({ spec: cfg.spec || '' }),
    build: (f, base) => ({ ...base, engine: 'jmespath', spec: f.spec })
  },
  {
    value: 'schema',
    label: 'Schema Validation',
    // Edited as formatted JSON, stored as a one-line string
    load: cfg => ({ spec_s3_uri: cfg.spec_s3_uri || '', spec: prettyJson(cfg.spec || '') }),
    build: (f, base) => ({
      version: base.version,
      name: base.name,
      spec_engine: 'jsonschema',
      type: base.type,
      spec_s3_uri: f.spec_s3_uri,
      spec: compactJson(f.spec)
    })
  },
  {
    value: 'sqs',
    label: 'SQS',
    processor: /sqs/i,
    switchDefaults: { operation: 'send_message' },
    load: cfg => ({ operation: cfg.operation || 'send_message', queue_name: cfg.queue_name || '' }),
    build: (f, base) => ({ ...base, operation: f.operation, queue_name: f.queue_name, channels: {} })
  },
  {
    value: 'sns_publish',
    label: 'SNS Publish',
    processor: /sns/i,
    switchDefaults: { operation: 'publish' },
    load: cfg => ({
      max_retries: cfg.max_retries ?? 3,
      operation: cfg.operation || 'publish',
      topic_arn: cfg.sns_config?.topic_arn || '',
      message_structure: cfg.sns_config?.message_structure || 'json',
      message_attributes: clone(cfg.sns_config?.message_attributes || []),
      input_path: cfg.input_path || '@'
    }),
    build: (f, base) => ({
      ...base,
      max_retries: f.max_retries,
      operation: f.operation,
      sns_config: {
        topic_arn: f.topic_arn,
        message_structure: f.message_structure,
        message_attributes: clone(f.message_attributes)
      },
      input_path: f.input_path
    })
  },
  {
    value: 'dynamodb',
    label: 'DynamoDB',
    processor: /dynamodb/i,
    switchDefaults: { operation: 'PUT_ITEM' },
    load: cfg => ({
      operation: cfg.operation || 'PUT_ITEM',
      partition_key: cfg.partition_key || 'pk',
      sort_key: cfg.sort_key || 'sk',
      table_name: cfg.table_name || '',
      region_name: cfg.region_name || 'eu-west-2'
    }),
    build: (f, base) => ({
      ...base,
      operation: f.operation,
      partition_key: f.partition_key,
      sort_key: f.sort_key,
      table_name: f.table_name,
      region_name: f.region_name
    })
  },
  {
    value: 'mock',
    label: 'Mock',
    load: cfg => ({ file: cfg.file || '' }),
    build: (f, base) => ({ ...base, file: f.file })
  }
]

const byValue = Object.fromEntries(CONFIG_TYPES.map(t => [t.value, t]))

export const DEFAULT_CONFIG_TYPE = 'lambda_function'

// A blank form with every field every type uses
export function emptyConfigForm() {
  return {
    type: DEFAULT_CONFIG_TYPE,
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
    operation: 'send_message',
    queue_name: '',
    topic_arn: '',
    message_structure: 'json',
    message_attributes: [],
    input_path: '@',
    partition_key: 'pk',
    sort_key: 'sk',
    table_name: '',
    region_name: 'eu-west-2',
    file: '',
    rules: {}
  }
}

// The form for a stored config block: blank form + common fields + the type's own fields
export function configToForm(cfg) {
  const type = byValue[cfg.type] ? cfg.type : DEFAULT_CONFIG_TYPE
  return {
    ...emptyConfigForm(),
    type,
    name: cfg.name || '',
    version: cfg.version || 'v1.0.0',
    ...byValue[type].load(cfg)
  }
}

// The config block generated from a form
export function formToConfig(form) {
  const base = { version: form.version || 'v1.0.0', name: form.name || '', type: form.type }
  const def = byValue[form.type]
  return def ? def.build(form, base) : base
}

// Values to apply when the user switches the form to `type`
export function switchDefaultsFor(type) {
  return byValue[type]?.switchDefaults || {}
}

// Guess the config type from a step's processor, e.g. ...SNSConnector → sns_publish
export function configTypeForProcessor(processor = '') {
  return CONFIG_TYPES.find(t => t.processor?.test(processor))?.value
}
