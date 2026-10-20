import { describe, it, expect } from 'vitest'
import {
  CONFIG_TYPES, emptyConfigForm, configToForm, formToConfig,
  switchDefaultsFor, configTypeForProcessor, compactJson
} from '../../src/config/configTypes'

// One stored config block per type, in the key order the framework uses
const EXAMPLES = {
  route: {
    version: 'v1.0.0', name: 'router', type: 'route',
    rules: { get: { field: 'httpMethod', value: 'GET', destination: 'step_a' } }
  },
  lambda_function: { version: 'v1.0.0', name: 'fn', type: 'lambda_function', invocation_type: 'Event' },
  http_connector: {
    version: 'v1.0.0', name: 'notify', type: 'http_connector', provider_key: 'notification_api',
    raw_auth_config: {
      auth_type: 'BEARER_TOKEN', token_url: 'env:TOKEN_URL', grant_type: 'client_credentials',
      client_id: 'sm:id', client_secret: 'sm:secret', scope: 'a/b'
    },
    max_retries: 5, timeout: 1000
  },
  mapping: { version: 'v1.0.0', name: 'map', type: 'mapping', engine: 'jmespath', spec: '{request: body}' },
  schema: {
    version: 'v1.0.0', name: 'study-schema', spec_engine: 'jsonschema', type: 'schema',
    spec_s3_uri: 'http://schema-registry/v1/', spec: '{"type":"object"}'
  },
  sqs: { version: 'v1.0.0', name: 'dlq', type: 'sqs', operation: 'send_message', queue_name: 'env:Q', channels: {} },
  sns_publish: {
    version: 'v1.0.0', name: 'topic', type: 'sns_publish', max_retries: 2, operation: 'publish',
    sns_config: {
      topic_arn: 'env:ARN', message_structure: 'json',
      message_attributes: [{ name: 'messageVersion', path: 'messageVersion', default: 'v1.0.0', data_type: 'String' }]
    },
    input_path: '@'
  },
  dynamodb: {
    version: 'v1.0.0', name: 'table', type: 'dynamodb', operation: 'GET_ITEM',
    partition_key: 'pk', sort_key: 'sk', table_name: 'env:T', region_name: 'eu-west-1'
  },
  mock: { version: 'v1.0.0', name: 'mock', type: 'mock', file: 'mocks/x.json' }
}

describe('config type registry', () => {
  it('has an example for every type (keep EXAMPLES in sync)', () => {
    expect(Object.keys(EXAMPLES).sort()).toEqual(CONFIG_TYPES.map(t => t.value).sort())
  })

  for (const [type, cfg] of Object.entries(EXAMPLES)) {
    it(`round-trips a ${type} config unchanged, keeping key order`, () => {
      const rebuilt = formToConfig(configToForm(cfg))
      expect(rebuilt).toEqual(cfg)
      expect(Object.keys(rebuilt)).toEqual(Object.keys(cfg))
    })
  }

  it('builds a lambda config from a blank form', () => {
    expect(formToConfig(emptyConfigForm())).toEqual({
      version: 'v1.0.0', name: '', type: 'lambda_function', invocation_type: 'RequestResponse'
    })
  })

  it('does not share nested objects between the form and the stored config', () => {
    const cfg = structuredClone(EXAMPLES.sns_publish)
    const form = configToForm(cfg)
    form.message_attributes[0].name = 'changed'
    expect(cfg.sns_config.message_attributes[0].name).toBe('messageVersion')
    const built = formToConfig(form)
    form.message_attributes[0].name = 'changed again'
    expect(built.sns_config.message_attributes[0].name).toBe('changed')
  })

  it('falls back to defaults for missing fields and unknown types', () => {
    expect(configToForm({ type: 'http_connector' })).toMatchObject({ auth_type: 'OAUTH_CLIENT_CREDENTIALS', max_retries: 3 })
    expect(configToForm({ type: 'nonsense', name: 'x' })).toMatchObject({ type: 'lambda_function', name: 'x' })
  })
})

describe('schema spec', () => {
  it('is formatted for editing and compacted for output', () => {
    const form = configToForm(EXAMPLES.schema)
    expect(form.spec).toBe('{\n  "type": "object"\n}')
    expect(formToConfig(form).spec).toBe('{"type":"object"}')
  })

  it('is kept exactly as typed when it is not valid JSON', () => {
    expect(compactJson('{ "type": ')).toBe('{ "type": ')
    expect(configToForm({ ...EXAMPLES.schema, spec: '{ broken' }).spec).toBe('{ broken')
  })
})

describe('switching type', () => {
  it('provides the default operation for types that have one', () => {
    expect(switchDefaultsFor('sqs')).toEqual({ operation: 'send_message' })
    expect(switchDefaultsFor('sns_publish')).toEqual({ operation: 'publish' })
    expect(switchDefaultsFor('dynamodb')).toEqual({ operation: 'PUT_ITEM' })
    expect(switchDefaultsFor('mock')).toEqual({})
  })
})

describe('configTypeForProcessor', () => {
  it.each([
    ['ipaas_framework.route.core.composite_router.CompositeRouter', 'route'],
    ['ipaas_framework.operate.lambda_connector.LambdaConnector', 'lambda_function'],
    ['ipaas_framework.operate.http_component.HTTPComponent', 'http_connector'],
    ['ipaas_framework.operate.sqs_connector.SQSConnector', 'sqs'],
    ['ipaas_framework.operate.sns.sns_connector.SNSConnector', 'sns_publish'],
    ['ipaas_framework.operate.dynamodb_connector.DynamoDBConnector', 'dynamodb'],
    ['ipaas_framework.transform.jmespath_transformer.JMESPathTransformer', 'mapping']
  ])('maps %s to %s', (processor, type) => {
    expect(configTypeForProcessor(processor)).toBe(type)
  })

  it('returns undefined for unknown or blank processors', () => {
    expect(configTypeForProcessor('something.Else')).toBeUndefined()
    expect(configTypeForProcessor('')).toBeUndefined()
    expect(configTypeForProcessor()).toBeUndefined()
  })
})
