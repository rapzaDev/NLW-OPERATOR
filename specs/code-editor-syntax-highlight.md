# Code Editor With Syntax Highlight

## Status

- Research and specification only.
- No implementation was done in this task.

## Context

We want to build a homepage code editor with live syntax highlight.

The expected behavior is:

- the editor starts with an example snippet
- the user can paste, edit, or replace the snippet
- syntax highlight should follow the detected language
- language detection should happen automatically
- the user should also be able to override the language manually

Current project context:

- stack: Next.js 16 + React 19 + TypeScript
- existing UI already has a custom editable `CodeEditor`
- the project already depends on `shiki`
- homepage editor is a marketing/product surface, not an IDE

## Goal

Define the best architecture for a syntax-highlighted editor on the homepage, balancing:

- visual quality
- responsiveness
- mobile behavior
- bundle size
- implementation complexity
- future extensibility

## Non-goals

- full IDE behavior
- autocomplete
- linting
- formatting on every keystroke
- LSP
- multi-file editing

## Research Summary

### 1. Ray.so style custom editor

This is the strongest reference for the current product direction.

What Ray.so appears to do:

- editable layer: `textarea`
- visual highlighted layer: separate rendered code layer
- syntax highlighting: `shiki`
- automatic language detection: `highlight.js`
- manual language override: language control in the UI

Relevant repository findings:

- `Editor.tsx` uses a `textarea` plus a `HighlightedCode` component
- `HighlightedCode.tsx` renders highlighted HTML with `shiki`
- `store/code.ts` uses `highlight.js.highlightAuto(...)` for language detection
- `LanguageControl.tsx` exposes a manual language selector
- `Editor.module.css` confirms the overlay approach

Conclusion:

- this is not a Monaco-style editor
- it is a custom overlay editor optimized for product presentation and visual output
- it matches our current homepage use case very well

### 2. CodeMirror 6

Strengths:

- purpose-built editable code editor
- modular architecture
- line numbers, history, selection, keymaps, syntax packages, gutters, search and many editor behaviors are available as extensions
- better long-term foundation if we expect the editor to become more than a homepage input

Weaknesses:

- more integration work to make it look exactly like the current visual language
- automatic language detection is not the central built-in story; we would still need our own detection layer
- if we want Shiki-level rendering parity, bridging that experience is more work than with a custom mirror

Conclusion:

- best option if the roadmap becomes "real editor first"
- not the best first fit for the current homepage scope

### 3. Monaco Editor

Strengths:

- richest editor feature set
- mature model/editor/provider architecture
- easy path toward advanced editor features later
- official Shiki integration exists via `@shikijs/monaco`

Weaknesses:

- heavy for a homepage editor
- worker setup and integration cost are higher
- official Monaco README says mobile browsers / mobile web app frameworks are not supported
- this is a bad tradeoff for a responsive homepage surface

Conclusion:

- not recommended for this project scope
- only worth revisiting if the product becomes a desktop-grade code workspace

## Decision

### Recommended approach for this project

Use a custom overlay editor inspired by Ray.so.

More specifically:

- keep a native `textarea` as the source of truth for editing
- render a synchronized highlighted mirror behind or under the `textarea`
- use `shiki` for syntax highlight rendering
- use `highlight.js` only for automatic language detection
- expose manual language selection in the homepage UI

This is the best fit because:

- it matches the actual UX we want
- it keeps the homepage lightweight compared to Monaco
- it is closer to our existing custom `CodeEditor`
- it aligns with the Ray.so reference the team likes
- it keeps full visual control in our own UI layer

### Strategic fallback

If the feature scope grows into a real editing experience with advanced keyboard behavior, selections, commands, or richer editing ergonomics, the preferred migration path should be CodeMirror 6, not Monaco.

## Proposed Architecture

### Core rendering model

Use two synchronized layers:

- input layer: `textarea`
- presentation layer: highlighted mirror

The mirror should:

- preserve whitespace
- preserve line breaks
- keep scroll position synchronized with the `textarea`
- reuse the same font metrics, padding, line height and letter spacing

The `textarea` should:

- own the real text value
- own selection, paste, mobile keyboard behavior and accessibility
- stay visually transparent except for the caret

## Language Detection Strategy

### Recommended strategy

1. On first load, use the example snippet and its known language.
2. When the user pastes or significantly edits content, run automatic detection.
3. Use `highlight.js.highlightAuto(...)` as a heuristic detector.
4. If confidence is weak or the snippet is too short, fall back to:
   - previous language when available
   - otherwise `plaintext`
5. Allow manual override at all times.
6. Once the user manually selects a language, stop auto-overriding until they explicitly switch back to auto mode.

### Important constraint

Automatic detection must be treated as heuristic, not truth.

Short snippets like:

- `const x = 1`
- `SELECT 1`
- `{ "a": 1 }`

can be misclassified easily. Because of that, manual override is mandatory in the product design.

## Highlighting Strategy

### Recommended strategy

Use `shiki` for rendering tokens and theme fidelity.

Implementation direction:

- create a singleton highlighter
- avoid recreating the highlighter on each update
- use fine-grained bundles instead of loading the whole Shiki bundle in the client
- start with a small supported language set for MVP
- lazy-load less common languages

### Suggested MVP languages

- javascript
- typescript
- jsx
- tsx
- json
- html
- css
- sql
- bash
- python
- markdown
- plaintext

## Performance Plan

### Rendering rules

- do not reinitialize the highlighter on every keystroke
- debounce expensive highlight updates
- update detection separately from token rendering
- highlight in a worker if main-thread cost becomes noticeable

### Suggested sequencing

1. Update raw text immediately.
2. Keep caret and editing fully responsive.
3. Run detection on a short debounce.
4. Run token rendering on a short debounce or worker.
5. Show last valid highlight while the new render is pending.

### Suggested thresholds

- detection debounce: 150ms to 250ms
- highlight debounce: 60ms to 120ms
- disable auto-detect for very short snippets, for example under 20 to 40 meaningful characters

## UX Specification

### Homepage editor controls

Required:

- auto/manual language mode
- language selector
- initial example code
- editable content area
- syntax highlight

Optional for MVP:

- copy button
- reset-to-example action
- line numbers toggle

### Behavior rules

- when the page loads, show example code
- when the editor receives focus, do not auto-select all text unless explicitly designed
- pasting should preserve line breaks and indentation
- typing must stay smooth even while highlight updates happen
- on unsupported language detection, show `plaintext`
- if the user manually chooses a language, persist that choice in local state for the current session

## Project-Fit Recommendation

### Recommended implementation path in this repository

Build on top of the current custom editor instead of replacing it immediately.

Reasoning:

- we already have a custom `CodeEditor`
- the homepage design is highly custom
- the desired UX is presentation-heavy, not IDE-heavy
- this path lets us add syntax highlight incrementally without introducing a large editor framework right away

### Suggested internal modules

- `src/components/ui/code-editor/*` or equivalent split by responsibility
- `editor-state`
- `editor-language`
- `editor-highlighter`
- `editor-overlay-sync`

Possible responsibilities:

- `editor-state`: current code, selected language, auto/manual mode
- `editor-language`: detection and supported-language registry
- `editor-highlighter`: Shiki singleton, lazy language loading, token generation
- `editor-overlay-sync`: scroll sync, line metrics, resize behavior

## Risks

### Main risks of the recommended approach

- overlay editors are visually great but can become fragile if editing behavior grows
- scroll sync and selection feel can drift if line metrics diverge
- IME/mobile edge cases require careful testing
- Shiki in the browser can be expensive if bundled naively

### Risk mitigation

- keep the source of truth in the native `textarea`
- start with a narrow MVP language set
- use fine-grained Shiki bundles
- keep manual language override visible
- define a migration path to CodeMirror if the editor scope expands

## TODOs

- [ ] Confirm whether the homepage editor is expected to stay "single-snippet only" or if the roadmap includes richer editing features.
- [ ] Confirm whether the language selector should always be visible or hidden behind an advanced/options control.
- [ ] Define the MVP supported language list.
- [ ] Define whether language choice should persist only in memory, URL state, or local storage.
- [ ] Define whether line numbers are part of MVP or post-MVP.
- [ ] Define whether the example snippet changes by default or should be fixed.
- [ ] Define detection fallback behavior for ambiguous snippets.
- [ ] Implement a language registry module with app-specific aliases.
- [ ] Implement auto/manual language mode in editor state.
- [ ] Implement debounced auto-detection using `highlight.js`.
- [ ] Implement Shiki highlighter singleton with fine-grained bundles.
- [ ] Implement lazy loading for non-core languages.
- [ ] Implement highlighted mirror rendering synchronized with the `textarea`.
- [ ] Implement scroll sync between input and highlight layers.
- [ ] Implement responsive behavior for small screens and mobile keyboards.
- [ ] Add unsupported-language fallback to plaintext.
- [ ] Add tests for detection, manual override, and rendering fallback.
- [ ] Measure typing latency before and after syntax highlight.
- [ ] Reassess CodeMirror 6 only if the feature scope expands beyond homepage editing.

## Open Questions

- Should manual language selection be visible by default on the homepage, or only after auto-detect fails / via an "advanced" control?
- Do we want the selected language and pasted code to persist in the URL, in local storage, or not persist at all?
- Is the intended scope still a visually polished snippet editor, or should we already plan for richer editing behaviors such as bracket assistance, indentation helpers and command shortcuts?

## Final Recommendation

For this project, the best next implementation path is:

- Ray.so-inspired custom overlay editor
- `textarea` for editing
- `shiki` for rendering
- `highlight.js` for auto-detect
- manual language selector on the homepage

CodeMirror 6 should remain the planned upgrade path if the editor becomes a real product surface instead of a homepage interaction.

## References

- Ray.so repository: [github.com/raycast/ray-so](https://github.com/raycast/ray-so)
- Ray.so `package.json`: [raw](https://raw.githubusercontent.com/raycast/ray-so/main/package.json)
- Ray.so `Editor.tsx`: [raw](https://raw.githubusercontent.com/raycast/ray-so/main/app/(navigation)/(code)/components/Editor.tsx)
- Ray.so `Editor.module.css`: [raw](https://raw.githubusercontent.com/raycast/ray-so/main/app/(navigation)/(code)/components/Editor.module.css)
- Ray.so `HighlightedCode.tsx`: [raw](https://raw.githubusercontent.com/raycast/ray-so/main/app/(navigation)/(code)/components/HighlightedCode.tsx)
- Ray.so `LanguageControl.tsx`: [raw](https://raw.githubusercontent.com/raycast/ray-so/main/app/(navigation)/(code)/components/LanguageControl.tsx)
- Ray.so `store/code.ts`: [raw](https://raw.githubusercontent.com/raycast/ray-so/main/app/(navigation)/(code)/store/code.ts)
- CodeMirror docs: [codemirror.net/docs/ref](https://codemirror.net/docs/ref/)
- CodeMirror repository README: [raw](https://raw.githubusercontent.com/codemirror/dev/main/README.md)
- Monaco Editor README: [raw](https://raw.githubusercontent.com/microsoft/monaco-editor/main/README.md)
- Shiki install guide: [shiki.style/guide/install](https://shiki.style/guide/install)
- Shiki performance guide: [raw](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/best-performance.md)
- Shiki bundles guide: [raw](https://raw.githubusercontent.com/shikijs/shiki/main/docs/guide/bundles.md)
- Shiki Monaco integration docs: [raw](https://raw.githubusercontent.com/shikijs/shiki/main/docs/packages/monaco.md)
- Highlight.js README: [raw](https://raw.githubusercontent.com/highlightjs/highlight.js/main/README.md)
