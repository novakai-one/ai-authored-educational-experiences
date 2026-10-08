# Instructions for Codex, Claude Code and other software implementers

## Authority

ChatGPT is the authoritative educational author. It owns **the actual experience**, not merely intent: exact wording, tone, terminology, examples, analogies, explanations, hints, dialogue, feedback, mathematics and reasoning, learning objectives, teaching order, activity/gameplay design, branching, success criteria, and intended visuals and animations.

You own software architecture, React/TypeScript, state, rendering, animation implementation, mathematical computation engines, tests, accessibility, performance, reliability, builds and deployment.

**Never author, paraphrase, shorten, elaborate, translate, correct, replace or generate learner-facing educational communication.** Never insert an explanation because a state seems confusing. Mathematical engines return facts, not teaching. Do not treat passing tests or a rendered page as evidence of educational quality.

## Before implementation

1. Read `AUTHORING.md`, `docs/WORKFLOW.md`, `docs/INTERACTIONS.md` and the complete assigned specification.
2. Use a separate `implementation/<id>` branch/worktree based on the exact frozen authoring commit. Record that SHA and the specification hash in the PR evidence. Do not work in the author's checkout.
3. Run validation. If an interaction is unsupported, implement it faithfully against an explicit contract. Do not silently ignore fields, default missing feedback, skip steps, clip visuals, substitute components or simplify activities.
4. If a specification is ambiguous, inconsistent or technically infeasible, document the exact JSON path, the observable problem and technical options in the PR or an issue. Ask ChatGPT for the educational decision. Continue independent infrastructure work.

## File ownership

- Treat `public/experiences/**` and `authoring/**` as read-only. This includes approvals, statuses, notices and review records. Only ChatGPT changes them, in separate authoring commits.
- Implementers edit `src/**`, `scripts/**`, `tests/**`, generated `schema/**`, tooling and implementation documentation.
- Changes to schemas, renderers, copy guards, approval checks or workflows are changes to the authoring contract. Explain them in the PR; never loosen validation merely to make tests green.
- Do not concurrently edit the same files. Freeze the authoring commit for an implementation pass. New educational changes require a new authoring commit, approval hash and handoff.
- The initial `development-fixture` is a deliberately labelled bootstrap exception. It is not permission to write future placeholder explanations or approve education. Ask ChatGPT to supply missing copy.
- Do not edit any `claude-ai-demo` repository as part of this project.

## Implementation constraints

- Render authored strings verbatim as plain text, with preserved whitespace. No interpolation of educational sentences, fallback copy, runtime LLM generation or native browser validation messages.
- All learner-facing labels, accessible names, diagram descriptions, hints and feedback must come from the specification. The only implementation-copy exception is non-educational loading/error/unapproved status in `src/diagnostics.tsx`.
- Keep computations separate from feedback selection. Respect authored tolerance and transitions. Changing an input invalidates old feedback; entering a step resets its local state, including self-transitions.
- Reduced motion must follow the authored `instant` fallback. Never remove an educationally meaningful action on your own.
- Custom components require strict configuration AND copy schemas, an exact version, declared transitions, accessible implementation, failure behavior, and fidelity tests. No `eval`, executable spec strings, arbitrary network requests or HTML injection.

## Before handoff

Run `npm run check` and `BASE_REF=<authoring-commit> npm run guard:diff`. Include a working preview artifact or URL, commit and spec hashes, automated results, screenshots, supported/unsupported behavior and known deviations. Use `docs/REVIEW.md`.

Do not edit approved content to make the implementation pass. Do not mark implementation fidelity or educational quality approved on ChatGPT's behalf. Make corrections in code and submit the same frozen content for author review again.

Review the complete output against the requested outcome before handoff and record concrete findings and repairs in the implementation evidence. For publication, verify the deployed HTTPS page and its exact specification hash, not only a successful build or uploaded artifact. Confirm live repository settings before claiming branch protection is active. A connected GitHub account does not by itself establish that the author's session has file-writing tools; use the access prerequisite in `AUTHORING.md`.

For hidden-result activities, inspect DOM and accessible descriptions as well as visible arrows: an authored graph description may contain the answer and must be gated with the reveal. Preserve explicitly triggered authored feedback verbatim, and report any tension between that feedback and the hidden-answer contract to ChatGPT. Capture every mode before and after success at desktop and mobile widths. Check reveals that mount new diagrams as well as reveals inside existing diagrams; both must honor the authored animation and reduced-motion behavior.

## Current user-directed presentation rule (2026-10-08)

Chris requires every vector expression in the Alignment Lab to appear as a vertical column, including authored sentences, choices and diagram readouts. This explicitly overrides the plain-text presentation constraint for vector notation only. Preserve the authored file bytes, words, component values and accessible names; typeset the existing expressions without paraphrasing or adding education.

## Show game review evidence as work progresses

Send me screenshots of the game for the bits you have played / signing off on and describe exactly what you see and what you are assessing - i need to understand what you are looking for and identify if there is anything we are seeing differently.
Paste in the conversation here as you go with commentary as per above.
