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

Every step must be reachable from `start` and have a graph path to a completion step. This does not prove a learner can or will finish, or that the sequence teaches well. Entry resets all local step state; self-transitions reset too. There is no persistence between steps or browser reloads. Answer edits clear feedback; vector changes clear both answers and feedback.

Colours are authored semantic choices. Implementers must report inaccessible authored colours and request an author decision; they must not quietly change a meaningful visual encoding. Solid/dashed styles and numeric readouts already distinguish the two vectors without colour alone.

## Requires new implementation

Dragging vectors, hidden-result prediction, 3D graphics, editable matrices, arbitrary expressions, symbolic algebra, proof checking, branching on history/attempt count, stored progress, narration/audio, rich mathematical typesetting, custom layouts, timeline animation, gamification and adaptive sequencing are **not implemented**. Add a strict new contract with tests and author review. Unknown fields and interaction names fail validation rather than acting as ignored hints.

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
3. A React component receiving `{ step, navigate }`. It can navigate only to the authored `actions` targets; it must render their authored labels. It may not fetch or generate communication, execute spec strings, or invent a fallback.
4. Explicit states, feedback selection rules, mathematical contracts, animation/reduced-motion behavior and accessible interactions agreed with ChatGPT. Any ambiguity returns to the author.
5. Contract and browser tests covering copy fidelity, reachable states, unsupported props, computation, animation and accessibility; evidence for ChatGPT's review.

The framework renders the common step title/body. Components render only their additional content and controls. All extension code belongs under `src/components/` so the copy guard scans it. Registry interfaces are an escape hatch for focused components, not an arbitrary-code plugin platform.
