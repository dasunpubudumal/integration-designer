# Integration Designer

Vue 3 + Pinia + Vite single-page app for designing iPaaS integration flows. It generates a YAML DSL file (flows and steps) and a companion JSON config file (one block per config key). There is no backend; state lives in `localStorage`. See `README.md` for the user-facing guide.

## Commands

Use Node 24 (`.nvmrc`). The npm scripts call `node node_modules/<tool>/...` directly to work around a `.bin` shim issue, so always go through them rather than `npx vite` / `npx vitest`.

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm test` | All tests (Vitest, jsdom) |
| `npm run test:unit` / `npm run test:integration` | One suite |
| `npm run build` | Production build into `dist/` (gitignored; CI builds it) |
| `npm run preview` | Serve `dist/` on port 3000 |

Before reporting a change as done, run `npm test` and `npm run build`. For UI changes, also look at the result in a browser (see the `verify-in-browser` skill).

## Layout

- `src/stores/flows.js`: the single Pinia store. Flows, steps, configs, selection, persistence, `renameConfig`, `uniqueConfigKey`, example data.
- `src/utils/generator.js`: pure functions `generateYaml(flows, configFileName)` and `generateJson(configs)`.
- `src/utils/stepTypes.js`: step types and their colours (single source for the dropdown and canvas cards).
- `src/config/processors.yaml`: processor suggestions per step type, keyed by step type name.
- `src/components/EditorPanel.vue`: flow, step and config editors. Most feature work lands here.
- `src/components/FlowCanvas.vue`: pipeline canvas, wheel zoom (anchored at the cursor), drag-to-pan, fixed flow header.
- `src/components/SelectMenu.vue`: the dropdown/combobox used everywhere instead of `<select>`/`<datalist>`.
- `src/components/OutputPanel.vue`: live YAML/JSON preview computed from the store.
- `tests/unit/`, `tests/integration/`: see the `write-tests` skill.

## How the editor works (read before changing EditorPanel)

- **Live autosave.** Form state (`flowForm`, `stepForm`, `configForm`) is written to the store by deep watchers with `flush: 'sync'`. The output panel is computed from the store, so it updates on every keystroke. There is no save button; don't add `@blur` save handlers.
- **Loading a form must not write back.** Wrap any code that fills a form from the store in `withoutAutosave(() => ...)`. Forgetting this writes stale or default values into the store (for example creating empty configs just by selecting a step).
- **Re-sync on selection only.** The form-sync watchers key on `store.selectedStep?.id` / `store.selectedFlow?.id`, not the objects. `updateStep`/`updateFlow` replace the object on every save; watching the object would re-sync mid-typing and undo input (for example `"Exception, "` collapsing to `"Exception"`). An integration test guards this.
- **Config key semantics.** Typing in Config Key renames the step's config live via `store.renameConfig` (which repoints every step in every flow). Picking from the list switches to an existing config and undoes any in-progress rename (`keyEditOrigin`). Typing a key that already exists never overwrites it; blur links to it. **+ New Config** creates and links a config immediately under `uniqueConfigKey(stepId)`.
- **Config form writes go to the committed key** (`store.selectedStep.configKey`), never to the raw text in the key input.
- **Every new step gets its own config** (`handleAddStep` in `FlowCanvas.vue`).

## SelectMenu

- Fixed lists: `<SelectMenu v-model="x" :options="[...]" />`; options are strings or `{ value, label, color? }`.
- Free text with suggestions: add `editable`. It emits `update:modelValue` on each keystroke, `select` when an option is picked and `change` on blur (not on pick).
- The popover is teleported to `<body>`, so tests must query `document`, not the wrapper.

## Conventions

- Match the surrounding style: Composition API with `<script setup>`, scoped styles, theme tokens from `:root` in `App.vue` (`--surface2`, `--accent`, etc.), short comments only where the why isn't obvious.
- Generated JSON key order matters to readers; build config objects in the order the framework's examples use.
- When a feature changes what users see, update `README.md` (and its screenshots if they become wrong; see the `update-screenshots` skill).
- CI runs three workflows (unit tests, integration tests, build); commit `package-lock.json` with any dependency change because CI uses `npm ci`.
