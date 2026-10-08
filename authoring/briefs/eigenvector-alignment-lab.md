# Alignment Lab — educational and interaction contract (revised)

**Educational author: ChatGPT.** Implementation owner: Codex / Claude Code.  
Source of all learner-visible text: `public/experiences/eigenvector-alignment-lab.json`.  
This contract supersedes the original brief for `eigen-mission@1`.

## What changed and why

The first version was functionally sound but cognitively crowded. A screenshot of stage 3 showed three instruction paragraphs plus a redundant question, while later stages presented several decisions at once. This is **not** acceptable instructional design. The new authored specification has shorter title/body/question text and requires the complex challenges to present **only one decision at a time**.

**Mandatory screen pattern:** one clear question → one learner action → contextual feedback → optional next action. Do not show instructions for future tasks until the learner reaches them. Show detailed explanation only after success. Stage number exists in `progressLabel`; do not add redundant numeric prefixes to visible titles.

The app is a game about direction and matrix multiplication, **not** a technical fixture with paragraphs. Keep one dominant visual and one concise answer area. Do not pad the screen with teaching prose or additional UI descriptions that ChatGPT did not author.

## Ownership boundaries

- ChatGPT owns exact titles, body paragraphs, controls, choices, explanations, hints, feedback, accessible descriptions, phase transitions, mathematics, and visual purpose. Only ChatGPT edits `public/experiences/**` and `authoring/**`.
- Implementer owns software, renderer, interactive state, mathematical evaluation, testing, animation, visual polish, and responsive behavior.
- Renderer **must not invent, paraphrase, summarise, expand or change** any learner-facing language; even extra success messages or instructional tooltips require ChatGPT-authoring first.
- Preserve all numerical values and current matrix mappings; the specification and its revised text are authoritative.
- Display **every vector expression as a vertically stacked column with square brackets**, including prose, choices, feedback, readouts and screen-reader-appropriate names, according to the user's explicit notation requirement. Preserve wording and component values. Matrices remain 2×2 matrices.

## Common mechanics

- Register `eigen-mission@1` with a strict per-mode `config` and `copy` schema. For new keys below, extend schema without weakening the unknown/missing-key checks. Fail visibly on unsupported config, rather than substituting a different activity.
- Stage progress: seven distinct stages; one active stage at a time. Each stage's `title`, `body`, `question` (if any), `submitLabel`, `retryLabel`, `hintLabel`, `hintText`, feedback and follow-up explanation are direct authored text.
- Clicking Check commits an answer. Correctness never follows from moving a control or selecting an item alone. Incorrect answers remain editable and show the exact relevant feedback. Reattempting clears stale feedback. After full stage success, reveal its authored explanation and the sole `actions[0]` navigation.
- Unearned answer/result coordinates remain concealed for stages 1, 4, 6 and 7. In stage 7, once the learner has correctly submitted the output, the author permits a compact recap of **their confirmed numbers** in the next phase; no diagrams appear until the entire challenge is complete. Conceal in drawn vectors, numerical readouts, accessible names/descriptions, tooltips and any other UI. A multiple-choice option may necessarily contain a correct numerical alternative; wrong feedback/hints must not disclose the complete solution. Stage 5 deliberately shows both arrows from the outset.
- Use source solid teal `#087f8c`, result dashed orange `#b94e20`, equal-scale Cartesian axes in [-7, 7], full straight-line direction guide through origin (not only a forward ray), snap-on-grid where specified, authored animation 650 ms, and immediate result fallback under reduced motion. Arrow tips must land at mathematically precise coordinates.
- Hints are shown using the authored `hintText`, never generative teaching. Respect `offerHintAfterAttempts` and retain hint/attempt metrics locally. Stages 4, 6 and 7 now have `offerHintAfterAttempts: 0`, so **Show a hint** is immediately available (but optional); its use is tracked separately from unaided completion. No tracking services or accounts.
- Maintain keyboard and pointer interaction. The component must not introduce browser-native validation sentences or other implementation-written learner prose.
- One visible task means **only the current phase's controls and prompt** appear. Do not show dormant future-phase fields, labels, captions or instructions.

## Exact seven-stage behavior

### 1. Predict (`predict-output`)

Matrix [[2,0],[0,1]]; teal source (2,1). Show only four authored possible endpoints; result remains hidden. Require choice + authored `submitLabel` commit. Wrong choices use their matching `feedbackB/C/D`. Correct A uses `feedbackA`, then reveal output (4,1), guide and `revealExplanation`. No early result readout.

### 2. Compare (`classify-line`)

Both vectors and full dotted line initially visible. Ask the sole `question`, with three existing choices, and require submitted choice. Wrong uses authored feedback; B is correct. Explanation comes only after success.

### 3. Explore (`hunt-direction`)

Start with source (1,1) under [[1,1],[0,1]]. Teal tip is draggable and accessible through authored coordinate fields (integers -3 through 3). Orange result and dotted line update live. The only initial learner instruction is the short authored body and `question`.

Upon `submitLabel`: (0,0) ⇒ `feedbackZero`; any turning vector ⇒ `feedbackTurned`; any nonzero vector with y=0 ⇒ `feedbackCorrect`, then `revealExplanation`. Setting y=0 does **not** automatically advance. Do not display the zero-vector caveat in the initial body; introduce only when relevant.

### 4. Calculate (`calculate-output`)

Matrix [[1,1],[0,1]], input (2,1), correct output (3,1). Keep orange vector hidden. Show the short authored body, question and TWO coordinates. The learner may request the authored hint immediately (`offerHintAfterAttempts: 0`). Submit evaluates invalid / x correct only / y correct only / neither / both correct, using exact authored feedback keys. Correct reveals arrow and explanation; never show result in graph description/readouts earlier.

### 5. Reverse (`classify-and-scale`) — **NEW progressive phases**

The matrix stays [[-2,0],[0,1]], source (1,0), result (-2,0), both arrows and infinite direction guide visible. The `config.answerSequence` explicitly requires two ordered decisions: `["same-line","scale"]`.

**Phase 1: same-line.**
- Show only `lineQuestion`, `choiceYes`, `choiceNo`, and **`lineSubmitLabel`**. Do not show `scaleQuestion` or `scaleInputLabel` yet.
- Missing choice ⇒ `feedbackInvalid`.
- Wrong choice No ⇒ `feedbackWrongLine`, then retry.
- Correct choice Yes ⇒ show `lineCorrectText` and authored **`phaseContinueLabel`** button; controls become locked.
- Only clicking `phaseContinueLabel` moves to phase 2. No stage continuation action yet.

**Phase 2: scale.**
- Show only `scaleQuestion`, `scaleInputLabel`, and `submitLabel`, with relevant visible context (same matrix/diagram). Phase 1 inputs no longer appear.
- Missing/non-numeric ⇒ **`feedbackInvalidMultiplier`**.
- Positive number ⇒ `feedbackPositiveScale`; other incorrect number ⇒ `feedbackWrongScale`.
- Correct λ=-2 ⇒ `feedbackCorrect`, `revealExplanation` and sole stage continuation.

### 6. Discover two (`two-directions`) — **NEW progressive phases**

Matrix [[2,1],[1,2]], four candidate vectors A=(1,1), B=(1,-1), C=(2,1), D=(1,0). The learner may request the authored hint immediately. The matrix and candidate source diagrams remain visible. Result diagrams/readouts stay concealed until **after both phases**. The `config.answerSequence` requires `["choose-directions","enter-multipliers"]`.

**Phase 1: choose-directions.**
- Show only `question`, `selectLabel`, candidate choices, and **`directionSubmitLabel`**. Do not render scalar/multiplier fields or `multiplierQuestion` yet.
- Wrong count / duplicate selection ⇒ `feedbackInvalid`. Includes C ⇒ `feedbackContainsC`; otherwise includes D ⇒ `feedbackContainsD`.
- Exactly A and B, any order ⇒ `directionCorrectText`, locked candidate selection and **`phaseContinueLabel`**.
- Clicking Continue proceeds to phase 2, without revealing transformed arrows.

**Phase 2: enter-multipliers.**
- Show only selected A and B candidate labels, `multiplierQuestion`, two authored `multiplierLabel` fields and `submitLabel`. Hide unselected controls and do not require selecting candidates again.
- Missing/non-numeric ⇒ **`feedbackInvalidMultipliers`**.
- Wrong λ for A ⇒ `feedbackWrongScaleA`; else wrong λ for B ⇒ `feedbackWrongScaleB`.
- λ_A=3 and λ_B=1 ⇒ `feedbackCorrect`, reveal A/B result arrows, `revealExplanation` and sole stage continuation.
- Keep C/D output arrows hidden even after solution, as previously authored.

### 7. Exit ticket (`exit-ticket`) — **NEW progressive phases**

Matrix [[3,0],[0,2]]. No visual result arrow, diagram, or unearned numerical/accessible answer before **the entire exit ticket** is solved. A verified answer from a completed earlier phase may be shown as explicitly authored earned context in the following phase. The `config.answerSequence` requires `["calculate-output","find-eigenvalue","classify-vector"]`.

**Phase 1: calculate-output.**
- Show `partAQuestion` about (2,0), the two `partAFirstInputLabel/partASecondInputLabel` controls, and **`outputSubmitLabel`**.
- Missing/non-numeric ⇒ `feedbackInvalid`; otherwise wrong coordinates ⇒ `feedbackWrongOutput`.
- Correct output (6,0) ⇒ show **`outputCorrectText`** + `phaseContinueLabel`; lock current inputs and wait for Continue. This earned result may be shown in the **next phase** as the authored `outputConfirmedText`; it must NOT be shown before the calculation is committed correctly.

**Phase 2: find-eigenvalue.**
- Show the short, already-earned **`outputConfirmedText`** as context alongside `partAScaleQuestion`, `partAScaleInputLabel` and **`scaleSubmitLabel`**. Do not show Part B yet. Do not force the learner to remember the numeric result from the prior phase.
- Missing/non-numeric ⇒ `feedbackInvalid`; incorrect λ ≠ 3 ⇒ `feedbackWrongScale`.
- Correct λ=3 ⇒ `scaleCorrectText` + `phaseContinueLabel`; wait for Continue.

**Phase 3: classify-vector.**
- Show `partBQuestion` about (1,1), `partBYes`, `partBNo` and `submitLabel` only.
- Missing choice ⇒ `feedbackInvalid`; Yes ⇒ `feedbackWrongClassification`; No ⇒ `feedbackCorrect`.
- After success, reveal both diagrams, exact `revealExplanation`, and final stage continuation. The two actual outputs are (6,0) and (3,2).
- Record per-phase attempt counts and hint usage in memory. A first-attempt/no-hint pass of each phase is different from coached completion; do not generate evaluative learner-facing copy.

## Screen composition / quality bar

Initial mobile/desktop stage 3 must present:
- Title: **Make the arrows line up**
- One body paragraph: **Move the teal dot. Watch the orange arrow.**
- Question: **Can you get the orange arrow onto the dotted line?**
- Controls: teal x and teal y, button **Check**, optional **Show a hint**, graph with dotted line and both arrows.
- No extra instruction paragraphs or explanatory prose until feedback.

At stages 5–7, manually check that the *next* question/inputs are not visible before the current phase succeeds and the user presses **Continue**. The intended experience is not three forms shown at once with CSS greyed out. The earlier phase's feedback should be visible and readable before moving on; then clear the previous phase's controls and feedback.

The visuals should support the action rather than compete with it. Keep mobile graph sufficiently large to interpret arrow directions, avoid offscreen next-phase buttons, and keep column vectors legible inside body sentences, radio/checkbox labels, feedback and coordinate readouts. Use authored accessible math labels.

## Acceptance tests and evidence required from Codex

1. Rebase implementation branch onto the **latest** ChatGPT authoring branch and record the new frozen commit and spec SHA-256. The old snapshot is superseded; implementation agent must not edit protected content to conform to schema.
2. Update `eigen-mission@1` strict config/copy schemas for the three new `answerSequence` variants and new exact copy keys; all existing modes continue to validate.
3. Unit/browser tests: mathematical outputs, error feedback, reveal boundaries, pointer/keyboard hunting, hint thresholds, target transitions, correct animation with and without reduced motion, and full reset/restart.
4. Add explicit **phase gating browser tests** for stage 5 (two phases), stage 6 (two) and stage 7 (three). Assert future inputs/prompts absent (not merely disabled); intermediate success displays authored feedback and a Continue button; no result leak before final success; re-entry resets to first phase.
5. Snapshot/DOM comparison of all exact authored copy strings and column-vector notation. Hidden results must not leak through ARIA, SVG descriptions or DOM.
6. For visual review, capture before, wrong-answer, hint, intermediate-success, and final reveal screens for each relevant stage on **desktop 1440px and mobile 390px**. Include actual rendered PNGs in the PR or another surface ChatGPT can inspect, and a stable interactive preview. A CI-green statement or text report alone is insufficient.
7. Run `npm run check` and `BASE_REF=<new_authoring_commit> npm run guard:diff`. Implementer PR targets `authoring/eigenvector-alignment-lab`, never `main`. Record both implementation commit and authoring spec hash.

### Educational review remains separate

Passing automated checks and preserving strings do not demonstrate that the learner understood. A real learner must complete the game, identify confusing phrases, and later solve a fresh problem. Do not mark this experience educationally approved on ChatGPT's behalf.
