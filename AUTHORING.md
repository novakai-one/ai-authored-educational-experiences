# Authoring as ChatGPT

You are the principal educational author. Write the **complete actual experience**, including the exact text the learner encounters. The software implementer may not make educational decisions from a summary of your intent.

Own all copy, accessible descriptions, feedback, explanations, mathematical reasoning, examples, objectives, success criteria, activity design, sequence, branching, visual meaning and motion. Keep pedagogical rationale in `objectives` and `successCriteria` or an accompanying authoring note; keep everything the learner must encounter explicitly in the step specifications. Prose notes alone do not execute.

## Begin through GitHub

1. Create `authoring/<experience-id>` from `main`.
2. Add `public/experiences/<experience-id>.json`. Use the [complete demonstration](public/experiences/linear-algebra-demo.json) as a **structural reference**, replacing all relevant fixture text, numbers and decisions. Use a new id matching the filename.
3. Set `author` to `ChatGPT`, `status` to `draft`, and supply an explicit unapproved `notice`. Read [supported interactions](docs/INTERACTIONS.md) before designing behavior; never simplify your design just to pass validation.
4. Use the generated [JSON Schema](schema/experience.schema.json) in an editor for field help. GitHub's plain file editor does not run schema validation; CI and `npm run validate` do. View the new activity at `/?experience=<experience-id>`.
5. Commit content separately from implementation. Open an authoring PR describing the experience and the outstanding implementation requirements. Freeze a commit for handoff.

`body` is an ordered array of exact paragraphs. No Markdown or HTML is interpreted. Whitespace, Unicode and punctuation are preserved. Button labels, input labels, diagram descriptions and every feedback outcome are authored too. Computed coordinate displays are numeric data; there are no generated explanation sentences.

## A concise new-activity example

This valid two-step example demonstrates a new activity without TypeScript. The strings are **example placeholders**, not approved teaching. Save it as `public/experiences/my-first-activity.json` to try it; replace it with your actual authored activity before approving it.

```json
{
  "$schema": "../../schema/experience.schema.json",
  "schemaVersion": 1,
  "id": "my-first-activity",
  "status": "draft",
  "author": "ChatGPT",
  "title": "Example authoring scaffold",
  "locale": "en",
  "notice": "UNAPPROVED EXAMPLE — replace all placeholder content.",
  "objectives": ["PLACEHOLDER: author a precise learning objective."],
  "successCriteria": ["PLACEHOLDER: author observable evidence of learning."],
  "start": "opening",
  "steps": [
    {
      "id": "opening",
      "kind": "message",
      "title": "PLACEHOLDER: opening title",
      "body": ["PLACEHOLDER: exact learner-facing communication goes here."],
      "action": { "label": "Continue", "target": "end" }
    },
    {
      "id": "end",
      "kind": "completion",
      "title": "PLACEHOLDER: closing title",
      "body": ["PLACEHOLDER: exact closing communication goes here."]
    }
  ]
}
```

For a mathematical activity, copy the full `vector-transform` step from the demo and author its matrix, initial vector, control range, diagram, animation, prompts, five feedback responses and routes. For example, `matrix: [[1, 1], [0, 1]]` and `initialVector: [2, 1]` produce `(3, 1)` without implementation changes. This is a technical configuration example, not a proposed lesson.

## Feedback and progression

The engine emits exactly one factual outcome: `invalid`, `correct`, `x-correct`, `y-correct`, or `incorrect`. You supply every response in `answer.feedback`; each can include an optional `{ "label": "…", "target": "step-id" }` action. Without an action, the learner can keep trying that step. There is no implicit next step, hint, explanation, or automatic progression. Outcomes are mutually exclusive and use your absolute `tolerance`.

Entering any step resets its local state to your specified initial values. Changing an input vector clears answers and feedback. Editing an answer clears feedback. The built-in vector activity always reveals both vector coordinate readouts; prediction with hidden results requires a new explicit contract. If this reset/reveal behavior does not fit your sequence, request a new capability instead of relying on implicit persistence.

## Approve a specification

Approval of the content and review of the implementation are separate decisions. Only you approve the specification:

1. Review the complete wording, mathematics, objectives, interaction design, visuals, accessibility copy and branches.
2. Set `status` to `approved`; remove or deliberately replace the draft notice. Do not retain placeholder statements in an approved experience.
3. Compute the exact saved file's SHA-256 (`sha256sum public/experiences/<id>.json`). CI's **Specification hashes** step also prints this after the status change, even if the missing approval makes validation fail.
4. Add the entry to `authoring/approvals.json` on the authoring branch:

```json
{
  "schemaVersion": 1,
  "approved": {
    "your-experience-id": {
      "sha256": "REPLACE_WITH_64_CHARACTER_SHA256_OF_THE_FINAL_FILE",
      "reviewer": "ChatGPT",
      "reviewReference": "Link to the authoring PR or a committed author review record"
    }
  }
}
```

The manifest above is illustrative; the repository intentionally starts with an empty approval map. Even a whitespace-only content change invalidates an approval. Update the approval only after author review. A hash establishes byte integrity, not identity or educational merit.

## Request a custom interaction

Describe exact behavior, copy, states, mathematical criteria, visual/animation intent, accessibility behavior, and transition actions. Use a `custom` step with `component`, exact `version`, authored `copy`, `config` and declared `actions`. Missing components fail with `unsupported component <name>@<version>` until implemented. [The extension contract](docs/INTERACTIONS.md#custom-components) explains the handoff. Unsupported configurations must stay explicitly blocked, not silently approximated.

Review the preview against every authored state using [REVIEW.md](docs/REVIEW.md). Record fidelity review against the implementation commit in `authoring/reviews/<id>.md`. Software test results are evidence of mechanics only; you separately judge educational quality.
