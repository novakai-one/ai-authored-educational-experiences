# Alignment Lab — ChatGPT implementation fidelity review

**Decision: CHANGES REQUESTED** (2026-10-08)  
Implementation PR: https://github.com/novakai-one/ai-authored-educational-experiences/pull/3  
Frozen authoring commit for reviewed code: `0beb0d8c7c1ecc4036b6300a029a12db08d1346b`  
Implementation commit reviewed: `139bee719eda50d4eb9d22aac6bdbda29b94bde0`  
Original implementation specification hash (as reported in PR): `5a16c1a48cf1e9bf4f89e697216e74e0309b8f5466c33536763144f251e5158c`  
**New authoring correction commit:** `966c03ff6ee0da2f9c9f04cf3e84ca53720f841a`  
The new specification hash must be recomputed by CI after rebasing/rebuilding.  
Preview (Codex-deployed, NOT independently played by ChatGPT): https://novakai-one.github.io/ai-authored-educational-experiences/previews/eigenvector-alignment-lab/?experience=eigenvector-alignment-lab

## Inspection and limits

I read the complete authoring spec/implementation brief, `docs/REVIEW.md`, implementation evidence README, engine, renderer, mission plane, notation renderer, schema, styles and browser/unit tests. I compared both commits using the GitHub compare operation. **The original implementation had no changes under `public/experiences/**` or `authoring/**`; the educational wording originated with ChatGPT.** The implementation uses those strings rather than independently generating explanations.

I could inspect code and browser-test assertions but could not directly operate the live preview or decode/display the 28 PNG screenshots in this session. Therefore I have **not personally visually verified** desktop/mobile layouts, text legibility, motion, screen-reader output, or actual response to user actions. Codex's report of 69 unit/18 headless browser tests, zero Axe violations and no overflow is **reported evidence, not an independent test run**. Links to screenshots and their claimed contents do not constitute personal visual inspection.

## Seven-stage review: code/contract and evidence

1. **Predict:** The React form uses authored four choices and `feedbackA/B/C/D`; submit disabled before a choice, result arrow and result readout withheld until solved. Tests exercise three wrong choices, hint threshold, hidden-result DOM, exact success and reveal animation.
2. **Classify:** Two vectors and full direction guide visible; three authored choices and feedback outcomes; explicit correct submit required. Browser tests cover incorrect classifications.
3. **Hunt:** Integer grid input via pointer, keyboard and fields; nonzero-v requirement enforced, all 49 states unit tested, success requires committed answer. Browser test exercises actual pointer drag and keyboard and rejection of origin.
4. **Calculate:** Numeric input and five authored feedback cases, with result vector and result-bearing descriptions withheld until solved. Browser tests cover invalid, x-only, y-only, neither, and correct outcomes.
5. **Reverse:** Code computes lambda=-2 and accepts opposite-facing vectors on one full line; both line classification and scalar are required. Tests exercise invalid, wrong line, positive scale, wrong scale, correct.
6. **Two directions:** Four panels, two choices and associated scalars, A/B only reveal on success. Tests cover both selection orders, wrong candidates, both wrong scalar branches and full success. **Authoring conflict corrected below.**
7. **Exit ticket:** Diagram absent before full correct answer; code checks output, eigenvalue and classification as one committed answer. Tests cover all error priorities, assessed attempts/hints and diagram reveal. **Authoring conflict corrected below.**

The column-vector formatter `AuthoredText.tsx` wraps numeric coordinate pairs in two-row square-bracket notation and is used for authored body paragraphs, choice labels, feedback, hints and numeric readouts. The source copy and accessible tuple label remain intact. A browser test checks the two components' vertical arrangement. I have not visually inspected the resulting glyph/line-wrap quality; this remains a required manual screenshot and live review before acceptance.

## Authoring conflict resolved by author

The original stage 6 wrong-answer messages included actual transformed vectors and eigenvalues, and the original stage 7 wrong-answer messages disclosed correct outputs before success. This conflicted with my broad authoring rule that hidden-result challenges should not divulge solutions before the full correct commit. Codex was right not to silently rewrite authored text.

**Author decision:** Withhold numerical solutions in wrong-answer feedback and in optional stage 6 hints. Preserve informative, targeted process feedback. I made these 7 exact wording changes in `public/experiences/eigenvector-alignment-lab.json` at commit `966c03ff6ee0da2f9c9f04cf3e84ca53720f841a`:
- `steps[two-directions].copy.hintText`
- `steps[two-directions].copy.feedbackContainsC`
- `steps[two-directions].copy.feedbackContainsD`
- `steps[two-directions].copy.feedbackWrongScaleA`
- `steps[two-directions].copy.feedbackWrongScaleB`
- `steps[exit-ticket].copy.feedbackWrongScale`
- `steps[exit-ticket].copy.feedbackWrongClassification`

Intentional exceptions to the general concealment rule remain: (a) stage 1 is explicitly multiple choice, so the possible numerical answers are presented as alternatives; (b) stage 5 explicitly displays the output for a line/multiplier classification; (c) a requested hint may show a row-by-row procedure without providing a completed numerical solution. After a successful answer, the full authored solution and diagrams must be shown.

## Required before acceptance

1. Rebase/update implementation PR #3 against the **new authoring correction** commit, with no implementation-authored changes to protected files. Update the frozen-baseline references and SHA-256 of the revised specification.
2. Rerun check, guard:diff, copy-fidelity, hidden-result/feedback, and browser tests with the revised copy; add explicit test coverage asserting wrong-answer feedback in stages 6 and 7 does **not** disclose the complete hidden numerical outputs/eigenvalues. Rebuild and publish a commit-specific preview.
3. Provide direct screenshots or a working browser review that ChatGPT can actually visually inspect, particularly column vector notation **inside sentence text, choice cards and readouts**, error and hint states, diagrams before and after reveal, and the four candidate panels at 390px. Existing screenshots are indexed but inaccessible as image pixels from this review session; their composition was not verified.
4. Confirm replay/reset and keyboard/screen-reader quality with direct interaction evidence and preserve reduced-motion behavior.
5. Return for a **fixed-commit** fidelity review. No merge to main while changes are requested.

## Educational quality (separate from fidelity)

**Not approved / not assessed with learner.** The technical sequence is more promising than the placeholder, but functional correctness does not establish whether the language, pacing, interface and challenge difficulty effectively teach eigenvectors. Evaluate with actual learner practice and check independent transfer/retention after the implementation is faithful.
