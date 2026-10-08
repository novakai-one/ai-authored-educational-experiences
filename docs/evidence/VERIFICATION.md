# Implementation evidence — 2026-10-08

Validated implementation commit: `5c279d47cd9fe35cfee7766e780b910cc0b2fc99`.
This report is added in a subsequent documentation-only commit. The fixture remains unapproved; this is software verification, **not an educational-quality or author-fidelity approval**.

## Checks performed

| Check | Result |
| --- | --- |
| `npm run schema:check` | Generated JSON Schema matches Zod source |
| `npm run build` | Strict content validation, copy guard, TypeScript and production Vite build passed |
| `npm test` | 36 tests passed across contract/math/copy/ownership suites |
| `npm run test:e2e` | 7 Chromium browser tests passed |
| Production preview | Served `dist/` at `http://127.0.0.1:4174/`; exact fixture text, correct feedback and completion exercised |
| Browser errors | None during production checks |
| Automated accessibility | Zero axe violations on desktop and 390 px mobile; this is not a complete accessibility audit |
| Source/build integrity | Specification bytes have identical SHA-256 in source and `dist/` |
| Git whitespace check | Passed |

Environment: Node.js 24.19.0, TypeScript 5.9.3, React 19.3.0, Chromium installed by Playwright 1.64.0. The lockfile records the complete dependency versions.

## Content-only update verification

The browser suite writes a temporary **new JSON specification file**, preserving application code. It changes the experience title, exact body whitespace/Unicode, matrix from `[[2,0],[0,1]]` to `[[1,1],[0,1]]`, animation duration, and success feedback. Loading `/?experience=content-only-test` displays the new text verbatim, computes `(3,1)` for `(2,1)`, and returns the new exact success response. The test deletes the temporary file afterward. No temporary content remains in the repository or build.

## Explicit failure verification

- Browser: an unknown interaction, an unimplemented custom component, and an approved-status document without a matching approval hash each show **Specification error**, with no vector activity rendered.
- Actual build: a temporary specification requested animation easing `bounce`. `npm run build` exited nonzero at validation with `steps.0.visual.animation.easing: Invalid option: expected one of "linear"|"ease-in-out"`. The temporary file was then removed.
- Contract tests reject missing feedback, unknown properties, invalid transitions, duplicates, unreachable/trapped steps, off-grid initial values, clipping, missing unapproved notices and false fixture provenance.
- Ownership tests use isolated real Git repositories. Code-only implementation passes; implementation edits to protected content fail; an advanced author baseline is detected; mixed code/content authoring commits fail.
- Copy tests reject literal explanations, accessible-label replacements, injected templates and raw HTML.

Canonical placeholder SHA-256:

```text
620d422053d5564e95d360f15ae049b4b72359081fd5ecf7bc0a6e9213ed2429
```

## Visual evidence

- [Desktop activity](demo-desktop.png)
- [Authored success feedback](authored-feedback.png)
- [Mobile activity](demo-mobile.png)
- [Visible unsupported-specification error](unsupported-spec.png)
- [Production browser check results](browser-check.json)

The activity includes keyboard-operable sliders, an SVG vector visualization, authored result interpolation, finite-number input checking, all five authored feedback cases, an optional message branch, completion and restart. The tests exercise reduced motion and ensure stale correctness cannot unlock progression after input changes.

## Publication status

At verification time the new public GitHub repository could not be created. Both `gh repo create` and `POST /user/repos` returned **403: Resource not accessible by integration** for the connected `novakai-one` credential. No existing repository was modified. In particular, `claude-ai-demo` was neither opened nor changed.

The local repository uses `main`. GitHub Actions, branch protection and Pages deployment have **not** been run or enabled remotely. CI and an optional Pages workflow are committed and ready; local verification is the evidence reported above. Once an empty public `novakai-one/ai-authored-educational-experiences` repository is created and accessible to the connection, push this repository and enable the settings described in [WORKFLOW.md](../WORKFLOW.md).
