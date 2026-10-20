import { describe, it, expect } from 'vitest'
import * as jsYaml from 'js-yaml'
import { generateYaml, generateJson } from '../../src/utils/generator'

function flow(overrides = {}) {
  return {
    id: 'f1',
    name: 'get_studies/v1',
    version: 'v0.1',
    method: 'GET',
    path: '/studies/v1',
    layer: 'PAPI',
    start: 'router',
    execution: null,
    steps: [],
    ...overrides
  }
}

function step(overrides = {}) {
  return {
    id: 's1',
    stepId: 'router',
    type: 'Route',
    processor: 'ipaas_framework.route.core.simple_router.SimpleRouter',
    input: '',
    configKey: '',
    next: 'END',
    output: null,
    onErrorContinue: null,
    ...overrides
  }
}

const parse = yaml => jsYaml.load(yaml).flows

describe('generateYaml', () => {
  it('returns a placeholder document when there are no flows', () => {
    expect(generateYaml([])).toBe('# No flows defined yet\nflows: []\n')
    expect(generateYaml(undefined)).toBe('# No flows defined yet\nflows: []\n')
  })

  it('writes the flow name as a bare key, without an explicit null', () => {
    const yaml = generateYaml([flow()])
    expect(yaml).toContain('  - get_studies/v1:\n')
    expect(yaml).not.toContain('get_studies/v1: null')
  })

  it('writes flow properties, falling back to defaults when blank', () => {
    const [f] = parse(generateYaml([flow({ version: '', method: '', path: '', layer: '' })]))
    expect(f).toMatchObject({ version: 'v0.1', method: 'GET', path: '/', layer: 'PAPI', start: 'router' })
  })

  it('writes steps with keys in DSL order', () => {
    const [f] = parse(generateYaml([flow({ steps: [step({ input: 'step.init.input', configKey: 'cfg' })] })]))
    expect(Object.keys(f.steps[0])).toEqual(['type', 'id', 'processor', 'input', 'config', 'next'])
  })

  it('references configs through the configured file name', () => {
    const [f] = parse(generateYaml([flow({ steps: [step({ configKey: 'my_cfg' })] })], 'other.json'))
    expect(f.steps[0].config).toBe('ref:config/other.json@my_cfg')
  })

  it('omits config and blank input, and trims input', () => {
    const [f] = parse(generateYaml([flow({ steps: [step({ input: '   ' }), step({ id: 's2', input: '  @  ' })] })]))
    expect(f.steps[0]).not.toHaveProperty('input')
    expect(f.steps[0]).not.toHaveProperty('config')
    expect(f.steps[1].input).toBe('@')
  })

  it('uses the step uid when the step has no ID, and END when next is blank', () => {
    const [f] = parse(generateYaml([flow({ steps: [step({ stepId: '', next: '' })] })]))
    expect(f.steps[0].id).toBe('s1')
    expect(f.steps[0].next).toBe('END')
  })

  it('writes output checks on the step', () => {
    const output = {
      value: '@',
      checks: { ok: { predicate: 'data.statusCode==`200`', next: 'notify' } }
    }
    const [f] = parse(generateYaml([flow({ steps: [step({ output })] })]))
    expect(f.steps[0].output).toEqual(output)
  })

  it('does not leak a step output onto the flow', () => {
    const output = { value: '@', checks: { ok: { predicate: 'true', next: 'END' } } }
    const [f] = parse(generateYaml([flow({ steps: [step({ output })] })]))
    expect(f).not.toHaveProperty('output')
  })

  it('writes on-error-continue only when enabled', () => {
    const enabled = { enabled: true, exceptions: ['Exception'], next: 'dlq' }
    const disabled = { enabled: false, exceptions: ['Exception'], next: 'dlq' }
    const [f] = parse(generateYaml([
      flow({ steps: [step({ onErrorContinue: enabled }), step({ id: 's2', onErrorContinue: disabled })] })
    ]))
    expect(f.steps[0]['on-error-continue']).toEqual({ exceptions: ['Exception'], next: 'dlq' })
    expect(f.steps[1]).not.toHaveProperty('on-error-continue')
  })

  it('writes the batch execution block when set', () => {
    const [f] = parse(generateYaml([flow({ execution: { type: 'batch', batch_input_path: 'body.Records' } })]))
    expect(f.execution).toEqual({ type: 'batch', batch_input_path: 'body.Records' })
  })

  it('omits an empty batch input path and a typeless execution block', () => {
    const [a, b] = parse(generateYaml([
      flow({ execution: { type: 'batch', batch_input_path: '' } }),
      flow({ name: 'other', execution: { type: '' } })
    ]))
    expect(a.execution).toEqual({ type: 'batch' })
    expect(b).not.toHaveProperty('execution')
  })
})

describe('generateJson', () => {
  it('returns {} when there are no configs', () => {
    expect(generateJson({})).toBe('{}')
    expect(generateJson(null)).toBe('{}')
  })

  it('pretty-prints configs with 4-space indentation', () => {
    const configs = { a: { type: 'mock', file: 'x.json' } }
    expect(generateJson(configs)).toBe(JSON.stringify(configs, null, 4))
  })
})
