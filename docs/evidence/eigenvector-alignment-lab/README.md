# Alignment Lab implementation evidence

Implements the seven challenges authored in PR #2. This is a review build, not an educational approval. The implementation PR targets `authoring/eigenvector-alignment-lab`; it must not merge directly to `main`.

## Frozen content

- Authoring commit: `0beb0d8c7c1ecc4036b6300a029a12db08d1346b`.
- Implementation branch: `implementation/eigenvector-alignment-lab`, created directly from that commit. The implementation PR records its exact reviewed head SHA and deployment run.
- Specification: `public/experiences/eigenvector-alignment-lab.json`.
- Specification SHA-256: `5a16c1a48cf1e9bf4f89e697216e74e0309b8f5466c33536763144f251e5158c`.
- Contract: `authoring/briefs/eigenvector-alignment-lab.md`.
- Contract SHA-256: `a36318e9c80e8dd0e4ba01cbc90aa92bbc1f957aa02a3631cb8e52b31878177a`.
- Protected files under `authoring/**` and `public/experiences/**` are unchanged, including approval/status records. The draft remains unapproved.

## Open the experience

[Hosted review preview](https://novakai-one.github.io/ai-authored-educational-experiences/previews/eigenvector-alignment-lab/?experience=eigenvector-alignment-lab).

The `Alignment Lab review preview` GitHub workflow runs only for this implementation branch. It publishes the draft under the isolated `/previews/eigenvector-alignment-lab/` path, alongside a fresh build of the existing `main` source at the root. It uploads `alignment-lab-preview-<implementation SHA>` as a downloadable artifact retained for 90 days. It does not merge or alter main source. The Pages environment permits the exact implementation branch in addition to main. A later root-only deployment may remove the temporary review URL; the commit and downloadable artifact remain the reproducible review reference.

For local review: `npm ci`, `npm run build`, `npm run preview`, then open `http://localhost:4173/?experience=eigenvector-alignment-lab`. For a downloaded static artifact, serve its extracted directory over HTTP (for example `python3 -m http.server 4173`) and use the same query. Opening `index.html` directly with `file://` is unsupported.

## Validation and observed behavior

`npm run check` passed locally after the final animation repair: generated-schema checks, both experience validations, renderer copy guard, TypeScript, production build, **69 unit tests and 18 headless Chromium browser tests**. The original demo's seven browser tests still pass. The PR checks provide the independent Linux CI result. Protected-content verification uses `BASE_REF=0beb0d8c7c1ecc4036b6300a029a12db08d1346b npm run guard:diff`.

| Stage | Tested decisions and reveal boundary |
| --- | --- |
| 1 — Predict | All four feedback branches; selection alone cannot advance; hint threshold; no result SVG/readout/answer-bearing description until correct submit |
| 2 — Classify | All three feedback branches; both vectors and full line visible initially; correct commit required |
| 3 — Hunt | All 49 input grid points checked mathematically; actual pointer drag, arrow keys and fields; zero rejected; movement alone cannot complete; committed nonzero horizontal input succeeds |
| 4 — Calculate | Invalid, x-only, y-only, neither and correct; signed-decimal parsing; result/description hidden until both coordinates are correct |
| 5 — Reverse | Invalid, wrong line, positive scalar, wrong scalar and correct in specified priority; both decisions required; negative eigenvalue accepted |
| 6 — Two directions | Invalid selection/scalars, C, D, wrong A scalar, wrong B scalar and correct; A/B can be chosen in either order; only A/B result arrows appear after full success |
| 7 — Exit | Invalid, wrong output, wrong scalar, wrong classification and correct; no diagrams before whole-answer success; first-attempt/no-hint and coached completion are distinguishable in memory |

Browser checks cover all authored feedback branches, exact body/feedback strings, input-edit feedback clearing, locked success, continuation gating, restart, unsupported schema failure, and no horizontal overflow at 390 px. Axe reports no violations before and after each of the seven mobile stages. Headless checks exercise 650 ms interpolated reveals both in an existing diagram and in the newly mounted final diagrams; reduced motion is exercised throughout. These checks are not a substitute for manual assistive-technology testing or learner evaluation.

## Screenshots

These 28 full-page PNGs were captured from the **production build** after the final code repair. Desktop viewport: 1440 × 1000; mobile: 390 × 844. Each after-state waits for exact final arrow endpoints. The hunt solution shown is (2,0). Screenshots show a successful run without hints; error states are exercised by browser tests.

| Challenge | Desktop before | Desktop after | Mobile before | Mobile after |
| --- | --- | --- | --- | --- |
| 1 | [Before](screenshots/desktop-01-before.png) | [After](screenshots/desktop-01-after.png) | [Before](screenshots/mobile-01-before.png) | [After](screenshots/mobile-01-after.png) |
| 2 | [Before](screenshots/desktop-02-before.png) | [After](screenshots/desktop-02-after.png) | [Before](screenshots/mobile-02-before.png) | [After](screenshots/mobile-02-after.png) |
| 3 | [Before](screenshots/desktop-03-before.png) | [After](screenshots/desktop-03-after.png) | [Before](screenshots/mobile-03-before.png) | [After](screenshots/mobile-03-after.png) |
| 4 | [Before](screenshots/desktop-04-before.png) | [After](screenshots/desktop-04-after.png) | [Before](screenshots/mobile-04-before.png) | [After](screenshots/mobile-04-after.png) |
| 5 | [Before](screenshots/desktop-05-before.png) | [After](screenshots/desktop-05-after.png) | [Before](screenshots/mobile-05-before.png) | [After](screenshots/mobile-05-after.png) |
| 6 | [Before](screenshots/desktop-06-before.png) | [After](screenshots/desktop-06-after.png) | [Before](screenshots/mobile-06-before.png) | [After](screenshots/mobile-06-after.png) |
| 7 | [Before](screenshots/desktop-07-before.png) | [After](screenshots/desktop-07-after.png) | [Before](screenshots/mobile-07-before.png) | [After](screenshots/mobile-07-after.png) |

Reproduce against a running production preview:

```sh
EVIDENCE_DIR=docs/evidence/eigenvector-alignment-lab/screenshots \
ALIGNMENT_PREVIEW_URL='http://127.0.0.1:4173/?experience=eigenvector-alignment-lab' \
npm run test:e2e -- tests/eigen-evidence.spec.ts
```

## Whole-output review and repairs

The review checked the actual seven before/after pairs on both screen sizes against the intended active challenge sequence, not just whether a page rendered.

1. Answer-bearing authored `graphDescription` strings could spoil stages 1, 4, 6 and 7 through accessibility text. They are gated with the result; the unrevealed diagram uses authored `a11yChoices`, and no diagram exists at all in unrevealed stage 7. Tests inspect DOM descriptions as well as visible result marks/readouts.
2. The final diagrams mount only on success, so their first implementation skipped interpolation. They now animate from source to output over the same 650 ms as other reveals. A browser regression checks the intermediate and exact final endpoints.
3. Small-panel grid labels were too small in the first visual pass. Their font size is now increased separately for desktop and mobile while keeping equal scales, authored coordinates and the [-7,7] domain. The final mobile panels remain intentionally compact; numeric source/result readouts remain available beneath them.
4. Coincident source/result arrows could conceal one encoding at eigenvalue 1. A wider solid source and smaller dashed result/arrowhead preserve both, with separate exact readouts. Arrowhead tips end at the mathematical endpoint rather than beyond it.
5. Candidate checkboxes and scalar fields have distinct accessible roles, with scalar names including the candidate and multiplier label. Tests initially used ambiguous label selectors; role-specific selectors now verify the real controls. No learner copy was changed to accommodate tests.
6. The original framework only accepted kebab-case copy keys. It now accepts authored camelCase keys, while strict per-mode schemas reject missing/unknown copy and config keys. Cross-validation rejects mismatched copy modes and independently checks supplied mathematical answers.

The copy guard change permits conditional values in existing technical attributes (such as SVG `role`). It does not exempt `aria-label`, explanations or generated sentences; regression tests confirm these remain rejected. Separate generated extension schemas and a semantic validation hook are explicit authoring-contract changes, documented in `docs/INTERACTIONS.md`.

## Points for ChatGPT's fidelity decision

- **Exact authored feedback versus the broad hidden-result rule:** `steps[6].copy.feedbackContainsC`, `feedbackContainsD`, `feedbackWrongScaleA` and `feedbackWrongScaleB`, and `steps[7].copy.feedbackWrongScale` / `feedbackWrongClassification`, disclose some answer numbers during an incorrect attempt. The implementation preserves those explicitly prescribed, triggered feedback strings, while withholding result diagrams/readouts and unsolicited descriptions until success. Please confirm this intended exception or issue a separate authoring correction. It would be inaccurate to claim that no possible answer text exists anywhere before success; stage 1 choices also necessarily contain the correct coordinates.
- Stage 6 reveals A/B results only, following its specific mode contract. C/D panels retain source vectors. No extra comparisons or explanatory copy were invented.
- Authored teal/orange values are unchanged. The palette check passed white-background graphical contrast and simulated color-vision separation; teal failed a general chroma-floor style heuristic. Solid/dashed encodings and exact readouts provide redundant identification. This heuristic is not itself a WCAG failure or a reason to rewrite authored colors.
- Attempt count, hint use and correctness are kept in React memory and exposed as technical DOM data for verification. Restart clears the run; reload loses it. No accounts, server storage, analytics or mastery claims were added.
- Fixed domain, numeric tick labels every two unit grid lines, compact mobile panels, and diagram-free-to-two-panel final reveal should be reviewed in the preview for teaching clarity. There are no known outstanding software test failures. Author fidelity and educational effectiveness remain separate, pending decisions.
