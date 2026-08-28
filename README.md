# Integration Designer

A browser-based visual designer for authoring iPaaS integration flows. It generates two output files — the YAML DSL that defines the flow pipeline and the companion JSON config that backs each step.

## Getting started

```bash
npm install
npm run dev
# → http://localhost:3000
```

For a production build served by Express:

```bash
npm run build
npm run serve
```

## What it generates

### YAML DSL (`study-papi-config.yaml`)

Describes one or more integration flows. Each flow is a sequential pipeline of steps executed from a named start point through to `END`.

```yaml
flows:
  - get_studies/v1:
    version: v0.1
    method: GET
    path: /studies/v1
    layer: PAPI
    start: study_papi_router
    steps:
      - type: Route
        id: study_papi_router
        processor: ipaas_framework.route.core.composite_router.CompositeRouter
        config: ref:config/papi_config.json@get_studies_papi_route
        next: step.study_papi_router.output.destination

      - type: Operate
        id: study_papi_function_connector
        processor: ipaas_framework.operate.lambda_connector.LambdaConnector
        input: step.init.input
        config: ref:config/papi_config.json@get_studies_papi_operate
        next: END
```

### JSON config (`papi_config.json`)

A flat object where each key is a named configuration block referenced by steps in the YAML via `ref:config/<filename>@<key>`. Config blocks are shared — multiple steps across multiple flows can reference the same key.

```json
{
  "get_studies_papi_route": {
    "version": "v1.0.0",
    "name": "study-router-schema",
    "type": "route",
    "rules": {
      "study-api-get": { "field": "httpMethod", "value": "GET", "destination": "study_papi_function_connector" }
    }
  },
  "get_studies_papi_operate": {
    "version": "v1.0.0",
    "name": "studies-system",
    "type": "lambda_function",
    "invocation_type": "RequestResponse"
  }
}
```

## UI overview

```
┌─── Top bar ─────────────────────────────────────────────────────────────┐
│ ⬡ Integration Designer  [config filename]  [Load Example] [Download]    │
├─── Flows (250px) ──────┬─── Canvas ──────────────────┬─── Editor (380px)─┤
│                        │                             │                   │
│ [+ New Flow]           │  GET /studies/v1  v0.1      │  Step / flow      │
│                        │                             │  properties +     │
│ ► get_studies/v1       │  ○ START                    │  config editor    │
│   sapio/studies/v1     │  │                          │                   │
│                        │  ┌─────────────────────┐   │                   │
│                        │  │ Route               │   │                   │
│                        │  │ study_papi_router    │   │                   │
│                        │  └─────────────────────┘   │                   │
│                        │  │                          │                   │
│                        │  ┌─────────────────────┐   │                   │
│                        │  │ Operate             │   │                   │
│                        │  │ study_papi_func...   │   │                   │
│                        │  └─────────────────────┘   │                   │
│                        │  │                          │                   │
│                        │  ○ END  [+ Add Step]        │                   │
├────────────────────────┴─────────────────────────────┴───────────────────┤
│ ▼ Output  [YAML] [JSON]  [Copy] [↓ YAML] [↓ JSON]                       │
│ <live syntax-highlighted preview>                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Step types

| Type | Purpose | Colour |
|------|---------|--------|
| **Route** | Conditional routing — evaluates rules to pick the next step | Blue |
| **Operate** | Invokes an external system (Lambda, HTTP, SQS, DynamoDB) | Green |
| **Transform** | Transforms data using a JMESPath expression | Amber |

### Conditional branching

An **Operate** step can declare `output.checks` — named predicates that redirect execution to a different step when true. The step-level `next` is the fallback path when no predicate matches.

```yaml
output:
  value: "@"
  checks:
    sequencescape_success:
      predicate: "data!=null && data.statusCode!=null && (data.statusCode==`200`||data.statusCode==`201`)"
      next: mlwh_sapi_function_connector
next: sequencescape_notification_transformer
```

The canvas shows each check inline beside the step as `✓ check_name → destination`.

### On-error-continue

Any step can declare `on-error-continue` to catch named exceptions and redirect execution rather than halting the flow:

```yaml
on-error-continue:
  exceptions: ["Exception"]
  next: study_creation_papi_dlq_connector
```

## Config block types

The editor surfaces a type-specific form for each config block. The type also determines which processor class is typically used in the step.

| Type | Key fields |
|------|-----------|
| `route` | `rules` — map of `{ field, value, destination }` |
| `lambda_function` | `invocation_type` (`RequestResponse` / `Event`) |
| `http_connector` | `provider_key`, `raw_auth_config` (OAuth2 / Bearer / Basic), `max_retries`, `timeout` |
| `mapping` | `engine: jmespath`, `spec` — JMESPath expression |
| `sqs` | `operation`, `queue_name` |
| `dynamodb` | `operation`, `partition_key`, `sort_key`, `table_name`, `region_name` |
| `mock` | `file` — path to a mock response JSON |

## Batch execution

Flows can run in batch mode — the framework splits an array from the incoming payload and runs the pipeline once per record:

```yaml
execution:
  type: batch
  batch_input_path: body.Records
```

Toggle **Batch Execution** in the flow properties panel to enable this.

## Persistence

State is automatically saved to `localStorage` on every change. Refreshing the page restores the last session. Use **Clear All** in the top bar to reset.

## Tech stack

- [Vue 3](https://vuejs.org/) with Composition API
- [Pinia](https://pinia.vuejs.org/) for state management
- [js-yaml](https://github.com/nodeca/js-yaml) for YAML serialisation
- [Vite 5](https://vitejs.dev/) for development and bundling
- [Express](https://expressjs.com/) for production serving (`npm run serve`)

## Known quirk

On Node 20 with some npm versions the `.bin/vite` shim is not recognised as an ES module. The `npm run dev` script bypasses this by calling `node node_modules/vite/bin/vite.js` directly.
