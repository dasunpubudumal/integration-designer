---
name: add-processor
description: Add a processor class (for example ipaas_framework.operate.sns.sns_connector.SNSConnector) to the Integration Designer's Processor suggestions for a step type, and map it to its config type. Use when the user names a new processor class or asks for a new Processor option.
---

# Add a processor

## 1. Suggestions

Add the class path under the right step type in `src/config/processors.yaml`:

```yaml
Operate:
  - ipaas_framework.operate.lambda_connector.LambdaConnector
  - ipaas_framework.operate.new_thing.NewConnector   # new
```

Top-level keys must match the step type names in `src/utils/stepTypes.js` exactly (`Validate`, `Enrich`, `Transform`, `Route`, `Operate`). Add the key if the type has no entry yet. Don't invent class paths: use exactly what the user gives.

## 2. Config type

If the processor has its own config shape, check whether a matching config type exists in `configTypes` in `src/components/EditorPanel.vue`.

- **It exists:** add `[/pattern/i, '<type>']` to `configTypeByProcessor` so **+ New Config** pre-selects it.
- **It doesn't:** ask the user for an example config block, then follow the `add-config-type` skill.

## 3. Test

`tests/integration/editor.test.js` has a test asserting the SNS connector is suggested for Operate steps. Add or extend a similar assertion for the new class, and, if you mapped it in step 2, a `+ New Config` test that sets the processor and checks the new config's `type`.

## 4. Docs and verify

Mention the processor in `README.md` if the user-facing lists name processors (the **Customising processor suggestions** example, the **Config types** table). Run `npm test` and `npm run build`.
