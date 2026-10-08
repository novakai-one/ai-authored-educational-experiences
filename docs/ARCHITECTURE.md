# Architecture and integrity boundaries

```text
ChatGPT JSON ── strict structure + semantic checks ── approval hash check
                                                            │
                                                            ▼
                                                   React step renderer
                                                            │
                                  authored controls ── math engine
                                                            │
                                             factual outcome identifier
                                                            │
                                       authored feedback + authored route
```

`public/experiences/` is the single canonical content source. Vite serves these files directly during development and copies them unchanged into the static build. The loader fetches by validated experience id, validates the entire document before rendering, verifies any approval hash, and sets the document title and language from the author specification. It does not render a partial experience when validation fails.

Zod is the source of truth for structure. `npm run schema` derives the checked-in JSON Schema; `schema:check` detects drift. Both CLI and browser use the same semantic validation, including domain bounds, graph integrity and registered component versions. Editor JSON Schema validates structure only; use the CLI for semantic checks. Extension `config` is structurally JSON but is rejected at runtime/build unless a registered strict contract accepts it.

The computation engine has no learner-facing strings. It calculates matrix outputs and returns a mutually exclusive outcome. The renderer looks up that exact entry in the author's feedback map. The math engine never selects wording, adds hints or decides the teaching order. Progression requires an authored action button. Numeric data is computed; communication is not.

## Safeguards and their limits

| Safeguard | What it verifies | What it does not establish |
| --- | --- | --- |
| Strict schema and semantic validation | Supported structure, coherent references and ranges, required feedback, no silent extra fields | Pedagogical appropriateness or truth of an author's explanation |
| Byte hashes | Approved runtime file exactly matches the recorded author approval | Whether the recorded reviewer really was ChatGPT |
| Branch diff guard | Implementation PRs do not alter protected author files; authoring commits do not mix code/content | Protection against an administrator editing the guard or forging provenance |
| Static copy check | Common literal JSX, string/template and CSS copy insertion mistakes; raw HTML bypasses | A proof that arbitrary TypeScript cannot synthesize text |
| Browser fidelity tests | Exact fixture DOM text, outcomes, navigation, input changes and explicit errors | Fidelity of every future custom component or effective learning |
| Author review and Git history | Visible decisions and traceable content/implementation changes | Independent identity when all agents use one GitHub account |

The only allowlisted implementation-authored UI copy is technical loading/error and unapproved-status text in `src/diagnostics.tsx`. The loader also contains technical errors. These must never become a place for educational explanations. `data-copy` attributes identify title/body source locations for inspection; other control copy is read directly from its typed spec field.

The initial placeholder is a software fixture written during infrastructure setup and labelled `development-fixture`. It has no author approval. `draft` and `placeholder` experiences require an authored notice and always display an additional implementation-enforced unapproved banner. A coding agent cannot honestly turn that fixture into approved teaching; ChatGPT must author and review a real specification.

There is no server, database, learner tracking, runtime model call, external font request, secret or authentication system. Built output is static and can be served on GitHub Pages or any HTTPS static host. This keeps the experiment focused on the authorship boundary.
