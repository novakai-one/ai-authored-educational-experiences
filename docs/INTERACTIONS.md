# Implemented interactions and limits

| Capability | Specification | Current behavior |
| --- | --- | --- |
| Exact communication | `title`, `body`, labels, descriptions, feedback | Plain text, preserved whitespace; no Markdown, HTML, translation or generated sentences |
| Message / dialogue panel | `kind: "message"` | Exact paragraphs and one explicit transition button |
| Linear transformation | `kind: "vector-transform"` | Real 2×2 matrix times a real 2D vector |
| Input vector | `interaction.kind: "coordinate-sliders"` | Two keyboard-accessible sliders with common authored min/max/step |
| Mathematical visual | `visual.kind: "vector-plane"` | Equal-scale square Cartesian grid, shared origin, solid source and dashed result arrows; current coordinate readouts always visible |
| Visual configuration | Domain, tick spacing, axis/legend labels, colours, description | Domain must contain all possible inputs and outputs; at most 40 tick intervals; no automatic rescaling or clipping |
| Animation | `trigger: "on-input"`, duration 0–5000 ms, easing | Result-arrow interpolation; `linear` or smoothstep `ease-in-out` (`3t²−2t³`); source arrow updates immediately |
| Reduced motion | `reducedMotion: "instant"` | Result snaps to final position; input still works |
| Answer entry | `answer.kind: "transformed-vector"` | Two text fields; signed decimal and scientific notation accepted; blank/nonfinite/arithmetic expressions rejected |
| Mathematical check | `tolerance` | Componentwise absolute numeric tolerance, between 0 and 1 |
| Context feedback | Five required feedback entries | Mutually exclusive `invalid`, `correct`, `x-correct`, `y-correct`, `incorrect`; no implicit pedagogical rule |
| Branching | Per-feedback optional `action` | Button label and target supplied by author; no automatic progression |
| Completion / restart | `kind: "completion"`, optional `restart` | Exact closing paragraphs and optional authored restart action |
| Custom request | `kind: "custom"` | Valid only when exact component/version and strict copy/config contracts are registered |

Every step must be reachable from `start` and have a graph path to a completion step. This does not prove a learner can or will finish, or that the sequence teaches well. Entry resets all local step state; self-transitions reset too. The standard interactions do not persist answers between steps or browser reloads. Answer edits clear feedback; vector changes clear both answers and feedback. The Alignment Lab retains only attempt/hint/correctness summaries in memory across its run; restarting clears them, and nothing is transmitted.

## Alignment Lab: `eigen-mission@1`

Implements the seven-mode contract in `authoring/briefs/eigenvector-alignment-lab.md`. It is available for author review, not educationally approved.

| Mode | Implemented interaction and reveal |
| --- | --- |
| `predict-output` | Four radio choices; committed correct prediction reveals the result and full line guide |
| `classify-line` | Three choices with both vectors initially visible; explicit check required |
| `hunt-direction` | Snapped pointer drag, arrow keys, and integer coordinate fields in [-3,3]; nonzero proportional output plus committed check required |
| `calculate-output` | Signed decimal coordinates, authored tolerance, five feedback outcomes; hidden result until success |
| `classify-and-scale` | Both line classification and signed multiplier required, including reversal |
| `two-directions` | Four equal-scale candidate panels; exactly two selections with associated multipliers; reveals only A/B outputs after success |
| `exit-ticket` | Three numeric answers and a classification committed together; no diagrams before whole-answer success |

All modes use strict mode-specific config and copy schemas plus cross-validation between the selected mode, copy keys and sole continuation. Supplied answers are independently verified against matrix computation; contradictory configurations fail visibly. Schemas are exported in `schema/eigen-mission.config.schema.json` and `schema/eigen-mission.copy.schema.json`. JSON Schema alone cannot perform the matrix checks; `npm run validate` is authoritative.

Results use 650 ms interpolation with immediate reduced-motion fallback. Source/result have solid/dashed encodings and exact coordinate readouts. The fixed [-7,7] square domain has unit grid spacing; numeric tick labels appear every two units. Before reveal, answer-bearing `graphDescription` is replaced with the exact authored `a11yChoices`; `a11yReveal` is mounted only on success. Explicitly authored choice and error-feedback text is retained even where it contains coordinates. See the evidence report for the author-review question this raises.

Numeric answers accept finite signed decimals, including `.5` and `-2.0`, but not exponents or expressions. This is the Alignment Lab contract, distinct from the original vector-transform parser. Correct submissions lock controls; unsolved edits clear feedback. Hints follow the authored attempt threshold. No automatic advancement, scoring, external analytics or invented assessment messages.

Colours are authored semantic choices. Implementers must report inaccessible authored colours and request an author decision; they must not quietly change a meaningful visual encoding. Solid/dashed styles and numeric readouts already distinguish the two vectors without colour alone.

## Requires new implementation

Outside the specific Alignment Lab contract above, generic dragging/prediction activities, 3D graphics, editable matrices, arbitrary expressions, symbolic algebra, proof checking, branching on history/attempt count, stored progress, narration/audio, rich mathematical typesetting, arbitrary custom layouts, timeline animation, gamification and adaptive sequencing are **not implemented**. Add a strict new contract with tests and author review. Unknown fields and interaction names fail validation rather than acting as ignored hints.

## Custom components

The `custom` shape lets an author request something beyond the current renderer. For example:

```json
{
  "id": "custom-step",
  "kind": "custom",
  "title": "AUTHOR SUPPLIES EXACT TITLE",
  "body": ["AUTHOR SUPPLIES EXACT COMMUNICATION"],
  "component": "vector-drag",
  "version": 1,
  "copy": { "drag-instruction": "AUTHOR SUPPLIES EXACT INSTRUCTION" },
  "config": { "gridMin": -5, "gridMax": 5 },
  "actions": [{ "label": "AUTHOR SUPPLIES EXACT BUTTON LABEL", "target": "end" }]
}
```

This example is deliberately **unsupported**. It must fail until an implementer registers `vector-drag@1` in `src/spec/extensions.ts`.

An extension must provide:

1. An exact version and strict `configSchema` rejecting unknown keys and invalid ranges. No coercions, defaults or transforms that change authored data.
2. A strict `copySchema` requiring every learner-facing string, including accessibility labels. Rendering still uses the original exact `step.copy` values.
3. A React component receiving `{ step, navigate }` and optionally an in-memory `recordAssessment` callback. It can navigate only to the authored `actions` targets; it must render their authored labels. It may not fetch or generate communication, execute spec strings, or invent a fallback. An optional `validateStep` hook enforces cross-field constraints beyond separate config/copy validation.
4. Explicit states, feedback selection rules, mathematical contracts, animation/reduced-motion behavior and accessible interactions agreed with ChatGPT. Any ambiguity returns to the author.
5. Contract and browser tests covering copy fidelity, reachable states, unsupported props, computation, animation and accessibility; evidence for ChatGPT's review.

The framework renders the common step title/body. Components render only their additional content and controls. All extension code belongs under `src/components/` so the copy guard scans it. Registry interfaces are an escape hatch for focused components, not an arbitrary-code plugin platform.
