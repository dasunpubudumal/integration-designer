---
name: add-config-type
description: Add a new Config Type (a JSON config block shape such as sns_publish or schema) to the Integration Designer, wired through the editor form, live output, processor mapping, tests and README. Use when the user asks to support a new kind of config, gives an example JSON config block, or asks for a new option in the Config Type dropdown.
---

# Add a config type

A config type is the `type` field of a JSON config block plus the form that edits it. Everything lives in `src/components/EditorPanel.vue` except the tests and docs. Work through every step; skipping one usually means a field that doesn't load, reset or appear in the output.

## 0. Pin down the shape

From the user's example JSON, list:

- the `type` string (for example `sns_publish`) and a human label (for example `SNS Publish`);
- every field, its default, and whether it's nested (for example `sns_config.topic_arn`);
- the **key order** in the example. Reproduce it exactly in the output.

Ask the user only if the example leaves the type string or a required field genuinely ambiguous.

## 1. Register the type

Add `{ value: '<type>', label: '<Label>' }` to the `configTypes` array.

## 2. Add form state

In the `configForm` `reactive({...})`, add one flat property per field, with its default. Reuse an existing property when the meaning is the same (`operation`, `max_retries`, `spec`, `name`, `version`) rather than adding a duplicate. Shared properties are why step 6 exists.

## 3. Load and reset

- `loadConfigForm(cfg)`: read each new field from `cfg`, unflattening nested paths with optional chaining (`cfg.sns_config?.topic_arn || ''`). Deep-copy arrays and objects (`JSON.parse(JSON.stringify(...))`) so the form never aliases store data.
- `resetConfigForm()`: set each new field back to its default.

## 4. Build the output

Add a `case '<type>':` to `buildConfigData()` returning the object **in the example's key order**. Start from `...base` (version, name, type) when that order matches; otherwise list `version`, `name`, `type` explicitly, as the `schema` case does. Deep-copy arrays and objects here too.

If a field is stored in a different form than it's edited (for example the schema spec is edited as formatted JSON but stored as a one-line string), convert in `buildConfigData` and convert back in `loadConfigForm`, and show a non-blocking warning for invalid input (see `schemaSpecError` and `compactJson`).

## 5. Add the form fields

Add a `<template v-else-if="configForm.type === '<type>'">` block next to the other `<!-- ... fields -->` blocks, inside the Config section:

- Text inputs: `<input v-model="configForm.x" placeholder="..." spellcheck="false" />` inside a `.form-group` with a `<label>`. Put two short fields side by side in a `.form-row`.
- Fixed choices: `<SelectMenu v-model="configForm.x" :options="[...]" />`. Never a native `<select>`.
- Numbers: `v-model.number` with `type="number"`.
- Lists of objects: follow the SNS **Message Attributes** pattern (`.subsection-header` with a `+ Add` button, `.check-block` per item, `push`/`splice` helpers, and a `.hint-text` empty state).
- Fixed values the user can't change: a readonly input styled `color:var(--text-muted)`, as for **Spec Engine**.

No save handlers are needed: the deep `configForm` watcher saves on every change.

## 6. Shared defaults

If the type shares `operation` (or another shared property) with a different default, add it to the `defaultOperation` map in `onConfigTypeChange()` so switching types doesn't carry over another type's value.

## 7. Processor mapping

If a processor class implies this type, add `[/pattern/i, '<type>']` to `configTypeByProcessor` so **+ New Config** pre-selects it. Put more specific patterns before general ones.

## 8. Tests

In `tests/integration/editor.test.js`, under `describe('config forms')`, add a test that picks the type, fills the fields with the `type`/`pick` helpers, and asserts the generated block with `toEqual`, including `Object.keys(...)` order. Add a test for any conversion or warning from step 4. See the `write-tests` skill.

## 9. Docs

- `README.md`: add a row to the **Config types** table (Config Type, `type` in JSON, key fields), plus a note if the form has non-obvious behaviour.
- If the type needs a new processor, use the `add-processor` skill as well.

## 10. Verify

Run `npm test` and `npm run build`. Then check the form in a browser (`verify-in-browser` skill): fill it in and confirm the JSON tab shows the block in the right shape, live.
