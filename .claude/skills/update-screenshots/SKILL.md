---
name: update-screenshots
description: Regenerate the README screenshots in docs/screenshots/ from the running Integration Designer, using the bundled Playwright capture script. Use when the UI has changed enough that README images are out of date, or when the user asks to refresh, retake or add screenshots.
---

# Update README screenshots

`scripts/capture.mjs` (next to this file) recreates all six images the README uses:

| File | Shows |
|------|-------|
| `overview.png` | Whole app, example loaded, a step selected, YAML output |
| `canvas-branching.png` | The batch flow with output-check labels (1920px window) |
| `step-editor.png` | Step Properties with the Type dropdown open |
| `config-sns.png` | SNS Publish config form, cropped to the Config section |
| `output-json.png` | JSON output for that SNS config, with a taller Output panel |
| `config-schema.png` | Schema Validation config form, cropped to the Config section |

It uses the app's example data plus the SNS and schema examples from the README, at `deviceScaleFactor: 2`.

## Steps

1. Build and serve the app:

   ```bash
   npm run build
   npx vite preview --port 4789 &
   ```

2. Playwright isn't a project dependency. In the session's scratchpad (not the repo), install it, copy the script there and run it, writing straight into the repo:

   ```bash
   cd <scratchpad>
   npm i playwright && npx playwright install chromium
   cp <repo>/.claude/skills/update-screenshots/scripts/capture.mjs .
   node capture.mjs <repo>/docs/screenshots http://localhost:4789
   ```

   If a Chromium is already installed but doesn't match Playwright's version, set `CHROMIUM_PATH` to its binary instead of downloading another.

3. Stop the server: `pkill -f "vite preview --port 4789"`.

4. **Read every image.** The script exits non-zero on page errors, but it can't judge framing. Check for clipped cards, open dropdowns covering content, stray focus rings and scrolled-away content. Adjust the script and re-run until each image is clean.

5. Check every `docs/screenshots/*.png` referenced in `README.md` exists, and that alt text and captions still describe what the image shows.

## Changing the set

- **Adding an image:** add a numbered section to `capture.mjs`, then reference it from the README section it illustrates, with descriptive alt text. Tall, narrow images (editor panels) go in an `<img width="360">` (side by side in a `<table>` when paired); wide ones use plain Markdown.
- **The UI changed:** selectors and labels in the script match the app's integration tests (`.step-card`, `.editor .form-group` by label, `.select-option`). Update them together.
- Keep the set small. Drop an image rather than keep one that repeats another.

If a screenshot reveals a UI bug, fix the bug rather than framing around it, and say so.
