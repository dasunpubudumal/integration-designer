import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import * as jsYaml from 'js-yaml'
import { mountApp, button, field, input, type, pick, selectStep, yaml, json } from './helpers'

let wrapper, store

beforeEach(async () => {
  ({ wrapper, store } = await mountApp())
})

describe('live output from the flow and step editors', () => {
  it('shows flow edits in the YAML while typing', async () => {
    await type(wrapper, 'Path', '/live/path')
    expect(await yaml(wrapper)).toContain('path: /live/path')
  })

  it('shows step edits in the YAML while typing', async () => {
    await selectStep(wrapper, 1)
    await type(wrapper, 'Input Expression', 'step.live.input')
    expect(await yaml(wrapper)).toContain('input: step.live.input')
  })

  it('offers the five step types and applies the chosen one', async () => {
    await selectStep(wrapper, 1)
    await field(wrapper, 'Type').find('.select-trigger').trigger('click')
    const labels = [...document.querySelectorAll('.select-option-label')].map(el => el.textContent)
    expect(labels).toEqual(['Validate', 'Enrich', 'Transform', 'Route', 'Operate'])

    document.querySelector('.select-option').click()
    await flushPromises()
    expect(await yaml(wrapper)).toContain('type: Validate')
  })

  it('suggests the SNS connector for Operate steps', async () => {
    await selectStep(wrapper, 1)
    await input(wrapper, 'Processor').trigger('focus')
    const labels = [...document.querySelectorAll('.select-option-label')].map(el => el.textContent)
    expect(labels).toContain('ipaas_framework.operate.sns.sns_connector.SNSConnector')
  })

  it('does not undo typing in a field that the store normalises', async () => {
    await selectStep(wrapper, 1)
    await field(wrapper, 'Enable on-error-continue').find('input').setValue(true)
    await type(wrapper, 'Exceptions (comma-separated)', 'Exception, ')
    expect(input(wrapper, 'Exceptions (comma-separated)').element.value).toBe('Exception, ')

    await type(wrapper, 'Exceptions (comma-separated)', 'Exception, TimeoutError')
    const step = jsYaml.load(await yaml(wrapper)).flows[0].steps[1]
    expect(step['on-error-continue'].exceptions).toEqual(['Exception', 'TimeoutError'])
  })

  it('adds output checks to the YAML', async () => {
    await selectStep(wrapper, 1)
    await button(wrapper, '+ Check').trigger('click')
    await flushPromises()
    const step = jsYaml.load(await yaml(wrapper)).flows[0].steps[1]
    expect(step.output.checks).toEqual({ check_1: { predicate: '', next: 'END' } })
  })
})

describe('adding a step', () => {
  it('creates and links a new config for the step', async () => {
    const stepId = `step_${wrapper.findAll('.step-card').length + 1}`
    await button(wrapper, '+ Add Step').trigger('click')
    await flushPromises()

    expect((await json(wrapper))[stepId]).toEqual({
      version: 'v1.0.0',
      name: stepId,
      type: 'lambda_function',
      invocation_type: 'RequestResponse'
    })
    expect(await yaml(wrapper)).toContain(`@${stepId}`)
    expect(input(wrapper, 'Config Key').element.value).toBe(stepId)
  })

  it('never overwrites an existing config with the same key', async () => {
    const stepId = `step_${wrapper.findAll('.step-card').length + 1}`
    store.saveConfig(stepId, { name: 'keep me' })
    await button(wrapper, '+ Add Step').trigger('click')
    await flushPromises()

    const configs = await json(wrapper)
    expect(configs[stepId]).toEqual({ name: 'keep me' })
    expect(configs[`${stepId}_2`].type).toBe('lambda_function')
  })
})

describe('config key', () => {
  let original, before

  beforeEach(async () => {
    await selectStep(wrapper, 1)
    original = input(wrapper, 'Config Key').element.value
    before = await json(wrapper)
  })

  it('renames the config live, keeping its position', async () => {
    await type(wrapper, 'Config Key', 'renamed_live')
    const after = await json(wrapper)
    expect(after).not.toHaveProperty(original)
    expect(after.renamed_live).toEqual(before[original])
    expect(Object.keys(after).indexOf('renamed_live')).toBe(Object.keys(before).indexOf(original))
    expect(await yaml(wrapper)).toContain('@renamed_live')
  })

  it('does not overwrite an existing config when its key is typed, and links it on blur', async () => {
    const other = Object.keys(before).find(k => k !== original)
    await type(wrapper, 'Config Key', 'partial')
    await type(wrapper, 'Config Key', other)
    expect(wrapper.find('.editor').text()).toContain('already exists')
    expect((await json(wrapper))[other]).toEqual(before[other])

    await input(wrapper, 'Config Key').trigger('blur')
    await flushPromises()
    const after = await json(wrapper)
    expect(after[original]).toEqual(before[original])
    expect(after).not.toHaveProperty('partial')
    expect(store.selectedStep.configKey).toBe(other)
  })

  it('undoes a partial rename when an existing config is picked', async () => {
    // Typing part of a key filters the list, and renames this config as a side effect
    const other = Object.keys(before).find(k => k !== original)
    const partial = other.slice(0, -1)
    await type(wrapper, 'Config Key', partial)
    expect(await json(wrapper)).toHaveProperty(partial)
    await pick(wrapper, 'Config Key', other)

    const after = await json(wrapper)
    expect(after[original]).toEqual(before[original])
    expect(after).not.toHaveProperty(partial)
    expect(store.selectedStep.configKey).toBe(other)
    expect(input(wrapper, 'Name').element.value).toBe(before[other].name)
  })

  it('restores the key when cleared and blurred', async () => {
    await type(wrapper, 'Config Key', '')
    await input(wrapper, 'Config Key').trigger('blur')
    await flushPromises()
    expect(input(wrapper, 'Config Key').element.value).toBe(original)
    expect(await json(wrapper)).toEqual(before)
  })

  it('+ New Config creates a config immediately, typed from the processor', async () => {
    await type(wrapper, 'Processor', 'ipaas_framework.operate.sns.sns_connector.SNSConnector')
    await button(wrapper, '+ New Config').trigger('click')
    await flushPromises()

    const key = input(wrapper, 'Config Key').element.value
    expect(key).not.toBe(original)
    expect((await json(wrapper))[key]).toMatchObject({ name: key, type: 'sns_publish', operation: 'publish' })
    expect((await json(wrapper))[original]).toEqual(before[original])

    const keyInput = input(wrapper, 'Config Key').element
    expect(document.activeElement).toBe(keyInput)
    expect([keyInput.selectionStart, keyInput.selectionEnd]).toEqual([0, key.length])
  })

  it('deletes the config and unlinks the step', async () => {
    await button(wrapper, 'Delete').trigger('click')
    await flushPromises()
    expect(await json(wrapper)).not.toHaveProperty(original)
    expect(store.selectedStep.configKey).toBe('')
    expect(input(wrapper, 'Config Key').element.value).toBe('')
  })
})

describe('config forms', () => {
  beforeEach(() => selectStep(wrapper, 1))

  const currentConfig = async () => (await json(wrapper))[store.selectedStep.configKey]

  it('shows field edits in the JSON while typing', async () => {
    await type(wrapper, 'Name', 'live-name')
    expect((await currentConfig()).name).toBe('live-name')
  })

  it('writes a Schema Validation spec as a single-line string', async () => {
    await pick(wrapper, 'Config Type', 'Schema Validation')
    await type(wrapper, 'Spec S3 URI', 'http://schema-registry.sanger.ac.uk/v1/')
    await type(wrapper, 'Spec (JSON Schema)', '{\n  "type": "object",\n  "required": ["name"]\n}')

    expect(await currentConfig()).toEqual({
      version: 'v1.0.0',
      name: expect.any(String),
      spec_engine: 'jsonschema',
      type: 'schema',
      spec_s3_uri: 'http://schema-registry.sanger.ac.uk/v1/',
      spec: '{"type":"object","required":["name"]}'
    })
    expect(Object.keys(await currentConfig())).toEqual(['version', 'name', 'spec_engine', 'type', 'spec_s3_uri', 'spec'])
  })

  it('warns about an invalid schema and keeps the text as typed', async () => {
    await pick(wrapper, 'Config Type', 'Schema Validation')
    await type(wrapper, 'Spec (JSON Schema)', '{ "type": ')
    expect(wrapper.find('.editor').text()).toContain('Invalid JSON')
    expect((await currentConfig()).spec).toBe('{ "type": ')
  })

  it('builds an SNS Publish config with message attributes', async () => {
    await pick(wrapper, 'Config Type', 'SNS Publish')
    await type(wrapper, 'Topic ARN', 'env:POST_STUDY_SNS_TOPIC_ARN')
    await button(wrapper, '+ Attribute').trigger('click')
    await flushPromises()
    await wrapper.find('.editor input[placeholder="attribute name"]').setValue('messageVersion')
    await type(wrapper, 'Path', 'messageVersion')
    await type(wrapper, 'Default', 'v1.0.0')
    await flushPromises()

    expect(await currentConfig()).toMatchObject({
      type: 'sns_publish',
      max_retries: 3,
      operation: 'publish',
      sns_config: {
        topic_arn: 'env:POST_STUDY_SNS_TOPIC_ARN',
        message_structure: 'json',
        message_attributes: [
          { name: 'messageVersion', path: 'messageVersion', default: 'v1.0.0', data_type: 'String' }
        ]
      },
      input_path: '@'
    })
  })

  it('switches the operation default with the config type', async () => {
    await pick(wrapper, 'Config Type', 'SQS')
    expect((await currentConfig()).operation).toBe('send_message')
    await pick(wrapper, 'Config Type', 'SNS Publish')
    expect((await currentConfig()).operation).toBe('publish')
  })
})
