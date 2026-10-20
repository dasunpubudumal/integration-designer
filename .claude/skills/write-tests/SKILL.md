---
name: write-tests
description: Write or extend unit and integration tests for the Integration Designer (Vitest, Vue Test Utils, jsdom), following the project's helpers and conventions. Use when adding a feature or fixing a bug, when the user asks for tests, or when deciding whether a change needs a unit or integration test.
---

# Writing tests

Tests run in Node with jsdom; no browser is needed. `npm test` runs everything, `npm run test:unit` and `npm run test:integration` run one suite, and `npx vitest run <file>` runs one file.

## Which kind

| Change | Test |
|--------|------|
| Logic in `src/utils/`, `src/config/`, `src/composables/` or `src/stores/` | Unit test in `tests/unit/` calling the function, composable or store action directly |
| A reusable component's own behaviour (`SelectMenu`) | Unit test mounting just that component |
| Anything the user does in the UI and sees change (editor fields, output, canvas) | Integration test in `tests/integration/` mounting the whole app |

A bug fix gets a test that fails without the fix. Check it does: temporarily revert the fix, run the test, see it fail, restore.

## Integration helpers (`tests/integration/helpers.js`)

```js
const { wrapper, store } = await mountApp()        // whole app, example loaded; { example: false } for empty
await selectStep(wrapper, 1)                       // click the nth step card
await type(wrapper, 'Input Expression', 'x')       // set the field with this exact label
await pick(wrapper, 'Config Type', 'SNS Publish')  // open a SelectMenu field and click an option
input(wrapper, 'Config Key').element.value         // read a field
await button(wrapper, '+ Add Step').trigger('click')
const configs = await json(wrapper)                // parsed JSON from the Output panel
const text = await yaml(wrapper)                   // YAML text from the Output panel
```

- Find fields by their **visible label**, not CSS classes or component internals, so tests read like the UI and survive refactors. Pass an index when a label repeats (`type(wrapper, 'Version', 'v2', 1)`).
- Assert on what the user sees: the Output panel (`json`/`yaml`) and field values. Use `store` only when the UI doesn't expose the fact (for example which config a step is linked to).
- Use `toEqual` on whole generated objects, and check `Object.keys(...)` when key order matters.
- After triggering anything, `await flushPromises()` (the helpers already do).

## Gotchas

- `SelectMenu` popovers are teleported to `<body>`: query `document.querySelectorAll('.select-option')`, not the wrapper.
- An open editable dropdown filters by what was typed; to pick an option after typing, type part of that option's label first.
- jsdom lacks `ResizeObserver`, `scrollIntoView` and pointer capture; `tests/setup.js` stubs them. Add new stubs there, not in individual tests.
- jsdom won't let you set `clientX`/`clientY` on wheel events; trigger `wheel` with `deltaY` only.
- `tests/setup.js` clears `localStorage`, auto-accepts `window.confirm` and auto-unmounts components after each test. Don't clear `document.body` yourself.
- Element sizes are all 0 in jsdom, so layout and zoom anchoring can't be asserted; check those in a browser (`verify-in-browser` skill).

## Unit test patterns

```js
beforeEach(() => {
  setActivePinia(createPinia())
  store = useFlowStore()
})
```

For the generator, build plain flow/step objects with the `flow()` and `step()` factories in `tests/unit/generator.test.js` and parse the YAML with `js-yaml` rather than matching strings, except when the exact text matters (for example the bare `name:` flow header).

## Finish

Run the full `npm test`. If you changed what the tests cover, update the **Testing** section of `README.md`.
