// Sample flows and configs loaded by "Load Example": a simple GET router flow
// and a batch POST flow with output-check branching and error handling.
// `uuid` is passed in so the store controls how internal ids are made.
export function createExampleData(uuid) {
  const flows = []

  // ── Flow 1: get_studies/v1 ────────────────────────────────────────────────
  const f1id = uuid()
  const f1s1id = uuid()
  const f1s2id = uuid()
  flows.push({
    id: f1id,
    name: 'get_studies/v1',
    version: 'v0.1',
    method: 'GET',
    path: '/studies/v1',
    layer: 'PAPI',
    start: 'study_papi_router',
    execution: null,
    steps: [
      {
        id: f1s1id,
        stepId: 'study_papi_router',
        type: 'Route',
        processor: 'ipaas_framework.route.core.composite_router.CompositeRouter',
        input: '',
        configKey: 'get_studies_papi_route',
        next: 'step.study_papi_router.output.destination',
        output: null,
        onErrorContinue: null
      },
      {
        id: f1s2id,
        stepId: 'study_papi_function_connector',
        type: 'Operate',
        processor: 'ipaas_framework.operate.lambda_connector.LambdaConnector',
        input: 'step.init.input',
        configKey: 'get_studies_papi_operate',
        next: 'END',
        output: null,
        onErrorContinue: null
      }
    ]
  })

  // ── Flow 2: sapio/studies/v1 ──────────────────────────────────────────────
  const f2id = uuid()
  const f2s1id = uuid()
  const f2s2id = uuid()
  const f2s3id = uuid()
  const f2s4id = uuid()
  const f2s5id = uuid()
  const f2s6id = uuid()
  const f2s7id = uuid()
  const f2s8id = uuid()
  const f2s9id = uuid()
  const f2s10id = uuid()

  flows.push({
    id: f2id,
    name: 'sapio/studies/v1',
    version: 'v0.1',
    method: 'POST',
    path: '/sapio/studies/v1',
    layer: 'PAPI',
    start: 'input_transformer',
    execution: {
      type: 'batch',
      batch_input_path: 'body.Records'
    },
    steps: [
      {
        id: f2s1id,
        stepId: 'input_transformer',
        type: 'Transform',
        processor: 'ipaas_framework.transform.jmespath_transformer.JMESPathTransformer',
        input: 'body',
        configKey: 'input_transformer',
        next: 'sequencescape_sapi_function_connector',
        output: null,
        onErrorContinue: null
      },
      {
        id: f2s2id,
        stepId: 'sequencescape_sapi_function_connector',
        type: 'Operate',
        processor: 'ipaas_framework.operate.lambda_connector.LambdaConnector',
        input: "{body: step.input_transformer.output.request, resource: '/sapio/studies/v1', path: '/sapio/studies/v1', httpMethod: 'POST'}",
        configKey: 'ss_studies_papi_operate',
        next: 'sequencescape_notification_transformer',
        output: {
          value: '@',
          checks: {
            sequencescape_success: {
              predicate: "data!=null && data.statusCode!=null && (data.statusCode==`200`||data.statusCode==`201`)",
              next: 'mlwh_sapi_function_connector'
            }
          }
        },
        onErrorContinue: null
      },
      {
        id: f2s3id,
        stepId: 'mlwh_sapi_function_connector',
        type: 'Operate',
        processor: 'ipaas_framework.operate.lambda_connector.LambdaConnector',
        input: "{body: step.input_transformer.output.request, resource: '/mlwh/studies/v1', path: '/mlwh/studies/v1', httpMethod: 'POST'}",
        configKey: 'mlwh_studies_papi_operate',
        next: 'mlwh_notification_transformer',
        output: {
          value: '@',
          checks: {
            mlwh_success: {
              predicate: "data!=null && data.statusCode!=null && (data.statusCode==`200`||data.statusCode==`201`)",
              next: 'study_creation_papi_success_status_transformer'
            }
          }
        },
        onErrorContinue: null
      },
      {
        id: f2s4id,
        stepId: 'study_creation_papi_success_status_transformer',
        type: 'Transform',
        processor: 'ipaas_framework.transform.jmespath_transformer.JMESPathTransformer',
        input: 'step.init.input',
        configKey: 'study_creation_papi_success_status_transformer',
        next: 'study_creation_papi_status_updater',
        output: null,
        onErrorContinue: null
      },
      {
        id: f2s5id,
        stepId: 'study_creation_papi_status_updater',
        type: 'Operate',
        processor: 'ipaas_framework.operate.dynamodb_connector.DynamoDBConnector',
        input: 'step.study_creation_papi_success_status_transformer.output',
        configKey: 'post_study_papi_status_updater',
        next: 'END',
        output: null,
        onErrorContinue: null
      },
      {
        id: f2s6id,
        stepId: 'sequencescape_notification_transformer',
        type: 'Transform',
        processor: 'ipaas_framework.transform.jmespath_transformer.JMESPathTransformer',
        input: 'step.sequencescape_sapi_function_connector.output',
        configKey: 'sequencescape_notification_transformer',
        next: 'study_creation_papi_failure_status_transformer',
        output: null,
        onErrorContinue: null
      },
      {
        id: f2s7id,
        stepId: 'mlwh_notification_transformer',
        type: 'Transform',
        processor: 'ipaas_framework.transform.jmespath_transformer.JMESPathTransformer',
        input: 'step.mlwh_sapi_function_connector.output',
        configKey: 'mlwh_notification_transformer',
        next: 'study_creation_papi_failure_status_transformer',
        output: null,
        onErrorContinue: null
      },
      {
        id: f2s8id,
        stepId: 'study_creation_papi_failure_status_transformer',
        type: 'Transform',
        processor: 'ipaas_framework.transform.jmespath_transformer.JMESPathTransformer',
        input: 'step.init.input',
        configKey: 'study_creation_papi_failure_status_transformer',
        next: 'error_notifier',
        output: null,
        onErrorContinue: null
      },
      {
        id: f2s9id,
        stepId: 'error_notifier',
        type: 'Operate',
        processor: 'ipaas_framework.operate.http_component.HTTPComponent',
        input: 'step.study_creation_papi_failure_status_transformer.input.request',
        configKey: 'notification_api_config',
        next: 'study_creation_papi_dlq_connector',
        output: null,
        onErrorContinue: {
          enabled: true,
          exceptions: ['Exception'],
          next: 'study_creation_papi_dlq_connector'
        }
      },
      {
        id: f2s10id,
        stepId: 'study_creation_papi_dlq_connector',
        type: 'Operate',
        processor: 'ipaas_framework.operate.sqs_connector.SQSConnector',
        input: 'step.init.input',
        configKey: 'post_study_papi_dlq_connector',
        next: 'END',
        output: null,
        onErrorContinue: null
      }
    ]
  })

  // ── Configs ───────────────────────────────────────────────────────────────
  const configs = {
    get_studies_papi_route: {
      version: 'v1.0.0',
      name: 'study-router-schema',
      type: 'route',
      rules: {
        'study-api-get': {
          field: 'httpMethod',
          value: 'GET',
          destination: 'study_papi_function_connector'
        }
      }
    },
    get_studies_papi_operate: {
      version: 'v1.0.0',
      name: 'studies-system',
      type: 'lambda_function',
      invocation_type: 'RequestResponse'
    },
    input_transformer: {
      version: '1.0.0',
      name: 'email-contact_template-transformer-schema',
      type: 'mapping',
      engine: 'jmespath',
      spec: '{request: body}'
    },
    ss_studies_papi_operate: {
      version: 'v1.0.0',
      name: 'sequencescape-studies-system',
      type: 'lambda_function',
      invocation_type: 'RequestResponse'
    },
    mlwh_studies_papi_operate: {
      version: 'v1.0.0',
      name: 'mlwh-studies-system',
      type: 'lambda_function',
      invocation_type: 'RequestResponse'
    },
    notification_api_config: {
      version: 'v1.0.0',
      name: 'Notification API Connector',
      type: 'http_connector',
      provider_key: 'notification_api',
      raw_auth_config: {
        auth_type: 'OAUTH_CLIENT_CREDENTIALS',
        token_url: 'env:NOTIFICATION_API_TOKEN_URL',
        grant_type: 'client_credentials',
        client_id: 'sm:inthub-env:ENV-notification-api.client_id',
        client_secret: 'sm:inthub-env:ENV-notification-api.client_secret',
        scope: 'notifications/write'
      },
      max_retries: 3,
      timeout: 30000
    },
    post_study_papi_dlq_connector: {
      version: 'v1.0.0',
      name: 'dlq-sqs-connector',
      type: 'sqs',
      operation: 'send_message',
      queue_name: 'env:SAPIO_STUDY_DLQ',
      channels: {}
    },
    post_study_papi_status_updater: {
      version: 'v1.0.0',
      name: 'hp-processor-sapi-status-updater',
      type: 'dynamodb',
      operation: 'PUT_ITEM',
      partition_key: 'pk',
      sort_key: 'sk',
      table_name: 'env:EVENT_STATUS_TABLE',
      region_name: 'eu-west-2'
    },
    study_creation_papi_success_status_transformer: {
      version: '1.0.0',
      name: 'success-status-transformer',
      type: 'mapping',
      engine: 'jmespath',
      spec: '{pk: body.studyId, sk: `SUCCESS`, status: `CREATED`}'
    },
    study_creation_papi_failure_status_transformer: {
      version: '1.0.0',
      name: 'failure-status-transformer',
      type: 'mapping',
      engine: 'jmespath',
      spec: '{pk: body.studyId, sk: `FAILED`, status: `ERROR`}'
    },
    sequencescape_notification_transformer: {
      version: '1.0.0',
      name: 'sequencescape-notification-transformer',
      type: 'mapping',
      engine: 'jmespath',
      spec: '{request: {title: `Study creation failed at Sequencescape`, body: @}}'
    },
    mlwh_notification_transformer: {
      version: '1.0.0',
      name: 'mlwh-notification-transformer',
      type: 'mapping',
      engine: 'jmespath',
      spec: '{request: {title: `Study creation failed at MLWH`, body: @}}'
    }
  }

  return { flows, configs }
}
