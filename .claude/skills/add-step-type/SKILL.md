---
name: add-step-type
description: Add, rename or remove a step type (Validate, Enrich, Transform, Route, Operate) in the Integration Designer, including its canvas colour, processor suggestions, tests and README. Use when the user asks for a new value in the step Type dropdown or to change the existing ones.
---

# Add a step type

Step types are defined once, in `src/utils/stepTypes.js`:

```js
export const STEP_TYPE_COLORS = {
  Validate: '#8b5cf6',
  ...
}
```

The key order is the order of the Type dropdown. The colour is used for the dropdown dot, the card badge and the card's left border; nothing else needs a colour.

## Steps

1. **Define it.** Add `Name: '#hex'` to `STEP_TYPE_COLORS` at the position the user wants. Pick a colour distinct from the others that reads on the dark `--surface2` background.
2. **Processors.** Add a `Name:` key with its processor class paths to `src/config/processors.yaml` if the user gives any. Don't invent class names: if none are given, leave the type out of the YAML (it just shows no suggestions) and tell the user.
3. **Renaming or removing a type:** search for the old name across `src/`, `tests/` and `README.md` (example data in `src/stores/exampleData.js` uses type names too). Flows saved in users' browsers keep the old value; mention that.
4. **Tests.** Update the expected list in the `offers the five step types` test in `tests/integration/editor.test.js` (and its name if the count changes).
5. **Docs.** Update the **Step types** table in `README.md` (type, purpose, colour name) and the count in **Features**. If the type dropdown screenshot is now wrong, use the `update-screenshots` skill.
6. **Verify.** `npm test` and `npm run build`, then look at the dropdown and a card of the new type in a browser (`verify-in-browser` skill).

The default type for new steps is `Operate`, set in `addNewStep` and `addStep` (`src/stores/flows.js`) and the generator's fallback (`src/utils/generator.js`). Change all three if the user wants a different default.
