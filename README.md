# AI-authored educational experiences

An experiment in **ChatGPT authoring the complete educational experience** and coding agents implementing it faithfully. ChatGPT owns exact learner-facing wording, reasoning, sequence, activities, feedback, visual intent, and learning criteria. Codex and Claude Code own the software.

Public repository: [novakai-one/ai-authored-educational-experiences](https://github.com/novakai-one/ai-authored-educational-experiences). Default branch: `main`. A clean [`authoring/first-experience`](https://github.com/novakai-one/ai-authored-educational-experiences/tree/authoring/first-experience) branch is ready for the first authored experience.

**[Open the hosted technical demonstration](https://novakai-one.github.io/ai-authored-educational-experiences/).** See [publication verification](docs/evidence/PUBLICATION.md) for the deployed commit, live checks and repository safeguards.

The included linear algebra activity is an **unapproved technical placeholder**, not a lesson about eigenvectors. No actual educational experience has been approved. Software tests do not establish educational quality.

## Alignment Lab review build

[Play the current Alignment Lab](https://novakai-one.github.io/ai-authored-educational-experiences/previews/eigenvector-alignment-lab/?experience=eigenvector-alignment-lab). This implementation includes the revised sequential challenges and Chris's requested compact worksheet redesign. [Screenshots and verification](docs/evidence/eigenvector-alignment-lab/README.md) cover desktop, mobile, wrong answers, hints and every phase. The build remains a draft; the stable root demonstration is separate.

## Start here

- **ChatGPT:** read [AUTHORING.md](AUTHORING.md), then create `authoring/<experience-id>` and author `public/experiences/<experience-id>.json`.
- **Codex / Claude Code:** read [AGENTS.md](AGENTS.md), then implement on `implementation/<experience-id>` from the frozen authoring commit.
- **Reviewers:** follow [the collaboration workflow](docs/WORKFLOW.md) and [the fidelity checklist](docs/REVIEW.md).
- **Capabilities:** [supported interactions and extension contracts](docs/INTERACTIONS.md).
- **Evidence:** [verification results](docs/evidence/VERIFICATION.md).

## Run

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
# Open http://localhost:5173
```

The default route loads `linear-algebra-demo.json`. A new file named `my-activity.json` is available at `/?experience=my-activity`, without changing application code. Reload after a specification edit. `npm run build` produces a static `dist/` directory; `npm run preview` serves it locally. Browser SHA-256 verification requires HTTPS or localhost.

```sh
npx playwright install --with-deps chromium
npm run check
```

## Repository structure

```text
public/experiences/       ChatGPT-owned experience JSON; development fixture is labelled
authoring/               ChatGPT-owned approvals and implementation review records
schema/                  Generated JSON Schema for authoring tools
src/spec/                Strict schemas, semantic validation, approval and extension contracts
src/engine/              Pure mathematical computation; returns facts, never explanations
src/components/          React renderers and animation
src/diagnostics.tsx      Allowlisted technical status/error copy only
scripts/                 Validation, schema generation and content-boundary checks
tests/                   Contract, copy-integrity and browser fidelity tests
docs/                    Workflow, capabilities, review checklist and evidence
.github/                 CI, preview artifacts, Pages deployment and PR templates
AGENTS.md                Rules for software implementers
AUTHORING.md             Instructions and example for ChatGPT
```

## Why JSON + Zod + React

JSON is directly editable through GitHub, produces clear content diffs, and needs no executable code. Zod rejects unknown fields and generates editor-friendly JSON Schema. Additional validation checks mathematical domains, transitions, completion paths, exact extension versions, and approval hashes. React implements a small set of explicit interactions. New text, numbers, supported motion settings and branching need only specification changes.

This is deliberately a small renderer, not a universal learning-game engine. A new interaction requires a new implementation contract. It must fail explicitly until implemented; agents must never substitute a simpler activity.

## Content integrity

All educational copy—including control labels, accessibility descriptions and feedback—is supplied by the specification. Strings render as plain text; the renderer does not use Markdown, HTML, generative explanations, or translation. Dynamic mathematics produces numbers and outcome identifiers only. The specification maps those identifiers to exact authored feedback and optional transitions.

Unapproved experiences always display a technical status banner and an authored notice. Approved files require a byte-for-byte SHA-256 match in `authoring/approvals.json`. CI rejects protected-content changes from implementation branches and catches accidental literal copy in rendering components. [Architecture and limitations](docs/ARCHITECTURE.md) explains the boundaries: these safeguards assist review and do not cryptographically identify ChatGPT or make a repository administrator unable to change code.

## GitHub preview

CI validates, builds, runs Chromium tests and uploads `preview-dist` and `implementation-evidence` artifacts. Download `preview-dist` and serve the extracted directory with `npx serve .`; open the URL it prints. Do not open `index.html` using `file://`.

Find these artifacts in a successful [Verify implementation run](https://github.com/novakai-one/ai-authored-educational-experiences/actions/workflows/ci.yml). Select the run for the exact implementation commit under review; GitHub sign-in is required to download Actions artifacts.

GitHub Pages is enabled with **GitHub Actions** as its source. To publish an update, merge reviewed changes to `main`, then run **Actions → Deploy preview → Run workflow → main**. The workflow reruns the full checks before deploying. Publishing is manual, so the hosted site stays on the last deployed commit until that workflow succeeds. PR previews are downloadable artifacts.

`main` requires a pull request, passing `verify` and `content-boundary` checks on an up-to-date branch, and resolved review conversations. These rules apply to administrators too. Force-pushes and branch deletion are disabled. See [the workflow](docs/WORKFLOW.md#github-enforcement) for the single-account review limitation.

Default branch: `main`. This repository is independent of `claude-ai-demo`.
