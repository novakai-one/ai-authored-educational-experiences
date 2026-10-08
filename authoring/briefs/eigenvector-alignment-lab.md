# Alignment Lab — implementation contract (ChatGPT authored)

**Specification:** `public/experiences/eigenvector-alignment-lab.json`  
**Owner of ALL educational decisions and learner-facing copy:** ChatGPT  
**Implementer:** Codex / Claude Code  
**Status:** DRAFT; do not approve educational content or publish to main without review.

## The product to build

This is a compact, 7-challenge interactive discovery game, **not a slideshow plus sliders**. The learner sees a single focused challenge at a time. Each challenge requires an intentional answer or action; passive slider movement never marks a challenge complete. Present one clear objective, one dominant interactive area, then specific feedback. Give it an inviting, polished lab/game feel, not a long text document. Maintain a visible seven-stage progress indicator. The implementation must not invent words, praise, explanations, dialogue, scoring, or instructional hints.

Use the exact strings in the JSON spec. Implement a **single custom component** named `eigen-mission@1` with strict discriminated config and copy schemas for all seven `mode` values: `predict-output`, `classify-line`, `hunt-direction`, `calculate-output`, `classify-and-scale`, `two-directions`, and `exit-ticket`.

### Common interaction contract

- The renderer displays the top-level step `title` and `body`. The extension displays the complete specified additional `copy` fields, with no extra educational words. It must not duplicate the title/body. Copy schema must reject missing or unknown keys, including extra feedback keys. Config schema must likewise reject missing or unknown keys. No generated explanations.
- Each puzzle has local state `attemptCount`, `hintUsed`, `submitted`, `isCorrect`, `selectedAnswer`, and `reveal`, as applicable. Entering a step resets it completely. Wrong attempts leave controls available. Correct submissions lock in success and reveal the authored result and explanation.
- Only after a correct submission render the sole authored `actions[0]` continuation button, and navigation uses that target. The progress indicator is authored via `progressLabel`; don't invent reward messages.
- Clicking `hintLabel` reveals `hintText` without exposing the correct result arrow. `offerHintAfterAttempts: 1` means the hint button is available after at least one incorrect submitted attempt. Where this setting is absent, the hint can be requested immediately. Record hint usage for assessment, but don't publish or transmit analytics.
- Check button `submitLabel` commits the current answer. A change of input clears old feedback and previous success only if still unsolved. Do not permit passing merely by changing slider values or selecting a choice without clicking submit. Never use native validation-message copy.
- All selections need keyboard/accessible equivalents and authored accessible labels/descriptions. Use code to compute numbers but not prose. Provide a textual after-reveal mathematical trace only from authored `revealExplanation`, not runtime-composed sentences.
- Source is solid teal; result is dashed orange. Equal units on x and y, common origin, endpoints and line guides mathematically exact. Visual domain [-7,7] and tick = 1; no clipping. Direction guide is an **infinite straight line through the origin**, NOT a ray (negative eigenvalues must count). Output-arrow animation = 650ms interpolation unless reduced-motion is requested; reduced-motion shows the exact final state immediately.
- Do not play sound by default or add unscripted narration. Do not add XP, streaks, confetti or extra user-facing copy.
- `correctId` and `correctVector` in the authored spec are independently checkable expected results; the implementation must calculate from `matrix` for validation and reject contradictory configs. Similarly verify each supplied `eigenvalue`, `resultVector`, `answerVector`, and `actualResult` against matrix operations.

### Seven modes and exact decisions

**1. `predict-output`:** Display source arrow (2,1), matrix, 4 choices. Hide all result-arrow/readout data before success. Radio or equivalent one-choice selection. Compare chosen id with `correctId`, use matching `feedbackA/B/C/D`. A correct committed choice reveals orange result, authored `revealExplanation` and continuation. Incorrect choice stays on puzzle and allows retry. Show `hintText` after wrong submission. Do not silently skip prediction.

**2. `classify-line`:** Display source/result arrows, full guide line and 3 choices. Compare with `correctId`. Display matching `feedbackA/B/C`. Correct choice reveals `revealExplanation` and continue.

**3. `hunt-direction`:** Display live source and computed output with line guide. Input can be dragged with snapping OR adjusted using explicitly authored coordinate labels; keyboards must support the latter. Input coordinate values are -3..3 integers. The challenge begins at (1,1), which **does not** satisfy the condition. Success means pressing `submitLabel` with **nonzero** v satisfying Av = λv for some real scalar (positive, zero or negative); for this matrix [[1,1],[0,1]], exactly those inputs with y=0 and x≠0 satisfy. If input is zero, show `feedbackZero`; if vector turns, show `feedbackTurned`; if correct, show `feedbackCorrect`, then `revealExplanation`, then the action. Dragging to a correct heading by itself is not completion. All numeric readouts can be shown here because experimentation is deliberate.

**4. `calculate-output`:** Matrix [[1,1],[0,1]], v=(2,1). Hide resulting orange arrow and exact result coordinates before success. Two numeric fields, checking with absolute tolerance 0. Determine outcomes in priority: invalid -> both correct -> x only -> y only -> neither. Use corresponding `feedbackInvalid`, `feedbackCorrect`, `feedbackXOnly`, `feedbackYOnly`, `feedbackNeither`. Correct result = (3,1). Reveal authored trace and arrow after success.

**5. `classify-and-scale`:** Display both vectors and line guide. Require BOTH a Yes/No classification AND one scalar input; do not advance after a partial answer. Correct is Same line and λ=-2. On error, prioritize invalid -> wrong line -> positive scale -> wrong scale. Use corresponding authored feedback. Correct shows `feedbackCorrect` and then `revealExplanation`. Crucially, treat opposite-facing vectors on the same infinite line as aligned, not as a failure.

**6. `two-directions`:** Show matrix and four candidates on separate equal-scale small grid panels; hide all four transformed arrows/results until full correct answer. Learner selects **exactly two distinct candidates** and enters a λ number for each selected candidate. Both candidate identities A and B and associated λ values 3 and 1 must be correct to complete. Wrong-answer priority: invalid -> contains C -> contains D -> wrong λ for A -> wrong λ for B. Specific messages must come from those authored `feedback...` keys. A candidate may be chosen in either order. On success reveal A result (3,3), B result (1,-1), and authored explanation. User must be allowed to revise both selected directions and scalar values.

**7. `exit-ticket`:** No vector diagrams OR transformed readouts until all answers have been submitted correctly. Show matrix [[3,0],[0,2]]. Require exactly: A output coordinates (6,0), A eigenvalue 3, B "No" for whether (1,1) is an eigenvector. Every answer must be submitted in one committed check. Prioritize feedback: invalid -> wrong output -> wrong scale -> wrong classification. Correct reveals the diagrams, `feedbackCorrect`, `revealExplanation`, and continue. Record `attemptCount` and `hintUsed`, but do not claim that coached completion equals first-attempt independent mastery. No new message about those metrics without ChatGPT supplying the exact words.

### UI and experience acceptance checks

1. **Real challenge:** At stages 1, 4, 6 and 7, the result vector is *not* visible before a correct commit, including legends, tooltips, ARIA strings, DOM text, coordinate readouts and graph labels. Internal JS data can contain the mathematical answer but must not leak it to the learner UI. After success, reveal is visible and correctly described.
2. **Active learning:** Simply dragging controls and never pressing a submit button cannot advance any step. The first two puzzles establish the difference between stretched and turned; stage 3 is exploratory; stage 4 makes the learner calculate; stages 5–6 require conceptual transfer; stage 7 works without a diagram.
3. **Mathematical correctness:** Independently unit-test the answer values and the special cases v=0, λ=0, opposite-direction outputs, vectors unchanged by A, and different multipliers in x/y.
4. **Feedback clarity:** Browser-test every authored feedback branch, including invalid, x-only, y-only and incorrect outcomes. Correct actions appear only after success. No generated educational wording.
5. **Visual fidelity:** Distinct teal and orange arrows, accurate arrowheads, arrow alignment, unobstructed labels, no clipped vectors, no hidden results mistakenly revealed. Screenshots at desktop and mobile, at least before and after answer reveal, for each mode.
6. **Accessibility:** Functional keyboard controls, focus order, readable contrast, labelled numeric fields, no reliance on colour, screen-reader descriptions that respect hidden-result rule, `prefers-reduced-motion` support.
7. **Assessment:** Final step usable without hints and attempts tracked in memory; external analytics, save-to-server and learner accounts are out of scope.
8. **Don't reinterpret design:** If an ambiguous config remains, refer the exact field to ChatGPT instead of designing a different game. If interaction unsupported, fail loudly rather than showing a slider-based approximation.

### Implementation deliverables

- Add a strict `eigen-mission@1` extension to `src/spec/extensions.ts`, with renderer(s) in `src/components/`. Maintain the clean separation from content.
- Build a preview for `/?experience=eigenvector-alignment-lab` and check it against the actual spec.
- Run all repository checks, copy guard and authoring-content diff guard from the frozen authoring commit.
- Submit `implementation/eigenvector-alignment-lab` as a PR **targeting `authoring/eigenvector-alignment-lab`**, not `main`. Include screen recordings/screenshots and state-by-state behavior evidence.
- Treat `public/experiences/**` and `authoring/**` as read-only. Don't approve, modify, or replace the draft.
- Never claim this proves educational effectiveness. ChatGPT will review the implementation and user testing will determine whether it helps learning.

### Scope discipline

One polished lab with seven stages is sufficient. No login, backend, general-purpose visual programming engine, unrelated chapters, or framework rebuild. The current sample demo must continue to work. Prioritise the quality and clarity of these particular interactions over framework extensibility.
