---
name: add-config-type
description: Add a new Config Type (a JSON config block shape such as sns_publish or schema) to the Integration Designer, wired through the config type registry, a fields component, tests and README. Use when the user asks to support a new kind of config, gives an example JSON config block, or asks for a new option in the Config Type dropdown.
---

# Add a config type

A config type has two halves:

- **A registry entry** in `src/config/configTypes.js`: pure data and functions describing how the JSON block loads into the editor form and is generated from it.
- **A fields component** in `src/components/editor/config-fields/`: the form inputs for that type.

`ConfigEditor.vue` handles everything else (key, type dropdown, name, version, autosave, delete) and needs no changes.

## 0. Pin down the shape

From the user's example JSON, list:

- the `type` string (for example `sns_publish`) and a dropdown label (for example `SNS Publish`);
- every field, its default, and whether it's nested (for example `sns_config.topic_arn`);
- the **key order** in the example. The generated block must reproduce it exactly.

Ask the user only if the example leaves the type string or a required field genuinely ambiguous.

## 1. Form fields

The editor uses one flat form for all types (`emptyConfigForm()` in `configTypes.js`), so values like `name`, `version` and `max_retries` survive switching types. Add one flat property per new field with its default. **Reuse** an existing property when the meaning is the same (`operation`, `max_retries`, `spec`, `input_path`) rather than adding a near-duplicate.

## 2. Registry entry

Add an object to `CONFIG_TYPES`, in the position it should appear in the dropdown:

```js
{
  value: 'sns_publish',
  label: 'SNS Publish',
  processor: /sns/i,                        // optional: processors that imply this type
  switchDefaults: { operation: 'publish' }, // optional: applied when the user switches to it
  load: cfg => ({                            // stored block → this type's form fields
    topic_arn: cfg.sns_config?.topic_arn || '',
    message_attributes: clone(cfg.sns_config?.message_attributes || []),
    // ...
  }),
  build: (f, base) => ({                     // form → block, in the example's key order
    ...base,                                 // base = { version, name, type }
    sns_config: { topic_arn: f.topic_arn, message_attributes: clone(f.message_attributes) },
    // ...
  })
}
```

- `load` returns only this type's fields; `configToForm` adds the blank form and the common fields around it. Fall back to the same defaults as `emptyConfigForm`.
- `build` must match the example's key order. Spread `base` when `version, name, type` come first; otherwise list them explicitly, as the `schema` entry does.
- `clone()` every array or object in both directions so the form never aliases store data.
- `switchDefaults` is needed when the type shares a property (usually `operation`) whose default differs from other types.
- If a field is edited in a different form than it's stored (the schema spec is edited as formatted JSON, stored as one line), convert in `build` and back in `load`, keeping invalid input as typed. See `compactJson` / `prettyJson`.
- Put a more specific `processor` pattern before a general one; the first match wins.

## 3. Fields component

Create `src/components/editor/config-fields/<Name>Fields.vue` and add it to the `CONFIG_FIELDS` map in `config-fields/index.js` under the type's `value`.

```vue
<template>
  <div class="form-group">
    <label>Topic ARN</label>
    <input v-model="form.topic_arn" placeholder="env:MY_SNS_TOPIC_ARN" spellcheck="false" />
  </div>
</template>

<script setup>
// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
```

- Each field is a `.form-group` with a `<label>`; tests find fields by that label. Put two short fields side by side in a `.form-row`.
- Fixed choices: `<SelectMenu v-model="form.x" :options="[...]" />` (from `../../common/SelectMenu.vue`), never a native `<select>`.
- Numbers: `v-model.number` with `type="number"`.
- Lists of items: copy the **Message Attributes** pattern in `SnsPublishFields.vue` (`.subsection-header` with a `+ Add` button, a `.check-block` per item, a `.btn-remove` button, and a `.hint-text` empty state).
- Fixed values: `<input value="jsonschema" readonly class="input-readonly" />`.
- Validation warnings: a `.hint-text.hint-text--error` under the field, computed in the component (see `SchemaFields.vue`).

Don't save anything from the component: mutating `form` is enough.

## 4. Tests

- **Unit:** add the example block to `EXAMPLES` in `tests/unit/configTypes.test.js`. The round-trip test then checks `load`/`build` and key order automatically (a guard test fails until you do). Add a `configTypeForProcessor` case if you set `processor`, and a `switchDefaultsFor` case if you set `switchDefaults`.
- **Integration:** in `tests/integration/editor.test.js` under `describe('config forms')`, pick the type, fill the fields with the `type`/`pick` helpers, and assert the generated JSON with `toEqual`. See the `write-tests` skill.

## 5. Docs

- `README.md`: add a row to the **Config types** table (Config Type, `type` in JSON, key fields), plus a note if the form has non-obvious behaviour.
- If the type needs a new processor class too, use the `add-processor` skill.

## 6. Verify

Run `npm test` and `npm run build`. Then fill the form in a browser (`verify-in-browser` skill) and confirm the JSON tab shows the block in the right shape, live.
