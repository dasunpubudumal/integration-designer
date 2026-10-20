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

```
src/
├── App.vue                      # Page shell: top bar, three columns, output panel
├── main.js                      # Bootstraps Vue/Pinia, global styles, restores saved state
├── components/
│   ├── layout/AppTopBar.vue     # Config file name, Load Example, Clear All, downloads
│   ├── sidebar/                 # FlowSidebar → NewFlowForm, FlowListItem
│   ├── canvas/                  # FlowCanvas → FlowHeader, PipelineStep → StepCard
│   ├── editor/                  # EditorPanel → FlowPropertiesForm | StepPropertiesForm + ConfigEditor
│   │   ├── OutputChecksEditor.vue, OnErrorContinueEditor.vue   # parts of the step form
│   │   └── config-fields/       # one fields component per config type + index.js map
│   ├── output/OutputPanel.vue   # Live YAML/JSON preview, copy, download
│   └── common/SelectMenu.vue    # Dropdown/combobox used everywhere instead of <select>/<datalist>
├── composables/
│   ├── useAutosave.js           # Save a form on every change; withoutAutosave() for loading
│   ├── useCanvasZoomPan.js      # Wheel zoom anchored at the cursor, drag to pan
│   └── useGeneratedFiles.js     # Live YAML/JSON from the store, and their downloads
├── config/
│   ├── configTypes.js           # Config type registry: load/build/defaults/processor mapping
│   ├── processors.yaml (+ .js)  # Processor suggestions per step type
├── stores/
│   ├── flows.js                 # The Pinia store: flows, steps, configs, selection, persistence
│   └── exampleData.js           # Data for "Load Example"
├── utils/                       # generator.js, highlight.js, download.js, stepTypes.js, httpMethods.js
└── styles/                      # global.css (theme, buttons, forms), editor.css (shared editor blocks)
```

Pure logic lives in `config/`, `utils/`, `composables/` and the store, with unit tests in `tests/unit/`. Components stay thin: they bind fields and call those modules. Keep it that way; if a component grows logic worth testing, move it out.

## How the editor works (read before changing the editor)

- **Live autosave.** Each form (`FlowPropertiesForm`, `StepPropertiesForm`, `ConfigEditor`) keeps a local reactive form and saves it with `useAutosave(form, save)`: a deep, `flush: 'sync'` watcher. The output panel is computed from the store, so it updates on every keystroke. There is no save button; don't add `@blur` save handlers.
- **Loading a form must not write back.** Fill a form from the store only inside the `withoutAutosave(() => ...)` that `useAutosave` returns. Forgetting this writes stale or default values into the store (for example creating empty configs just by selecting a step).
- **Re-load on selection only.** The load watchers key on `store.selectedStep?.id` / `store.selectedFlow?.id`, not the objects. `updateStep`/`updateFlow` replace the object on every save; watching the object would re-load mid-typing and undo input (for example `"Exception, "` collapsing to `"Exception"`). An integration test guards this.
- **Child editors mutate the parent's form.** `OutputChecksEditor`, `OnErrorContinueEditor` and the `config-fields/*` components receive the parent's reactive form as a `form` prop and edit it in place; the parent's autosave picks the changes up. They never save to the store themselves.
- **Config types are data.** `config/configTypes.js` defines every type (`load`, `build`, `switchDefaults`, `processor`) over one flat form (`emptyConfigForm`) shared by all types. `ConfigEditor` renders `CONFIG_FIELDS[form.type]` from `config-fields/index.js`. Use the `add-config-type` skill to add one.
- **Config key semantics** (in `ConfigEditor`). Typing in Config Key renames the step's config live via `store.renameConfig` (which repoints every step in every flow). Picking from the list switches to an existing config and undoes any in-progress rename (`keyEditOrigin`). Typing a key that already exists never overwrites it; blur links to it. **+ New Config** creates and links a config immediately under `uniqueConfigKey(stepId)`.
- **Config form writes go to the committed key** (`store.selectedStep.configKey`), never to the raw text in the key input.
- **Every new step gets its own config** (`store.addNewStep()`).

## SelectMenu

- Fixed lists: `<SelectMenu v-model="x" :options="[...]" />`; options are strings or `{ value, label, color? }`.
- Free text with suggestions: add `editable`. It emits `update:modelValue` on each keystroke, `select` when an option is picked and `change` on blur (not on pick).
- The popover is teleported to `<body>`, so tests must query `document`, not the wrapper.

## Conventions

- Match the surrounding style: Composition API with `<script setup>`, scoped styles for anything one component owns, theme tokens from `:root` in `styles/global.css` (`--surface2`, `--accent`, etc.), short comments only where the why isn't obvious. Classes shared across editor components go in `styles/editor.css`.
- Generated JSON key order matters to readers; build config objects in the order the framework's examples use.
- When a feature changes what users see, update `README.md` (and its screenshots if they become wrong; see the `update-screenshots` skill).
- CI runs four workflows: unit tests, integration tests and build on every push and PR, and a GitHub Pages deployment from `main` (tests must pass first). Commit `package-lock.json` with any dependency change because CI uses `npm ci`.
- The build uses relative asset URLs (`base: './'` in `vite.config.js`) because Pages serves it from `/integration-designer/`. Don't reference assets with root-absolute paths like `/favicon.svg` from code; use relative ones or Vite imports.
