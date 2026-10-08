# Publication and handoff review — 2026-10-08

## Intended outcome

Finish the independent public repository, provide a working hosted technical demonstration, and make the author/implementer workflow usable. This review checks infrastructure and implementation behavior. The fixture remains unapproved; no educational-quality or ChatGPT author-fidelity approval is asserted.

- Repository: [novakai-one/ai-authored-educational-experiences](https://github.com/novakai-one/ai-authored-educational-experiences)
- Default branch: `main`
- Hosted demonstration: <https://novakai-one.github.io/ai-authored-educational-experiences/>
- Frozen authoring/implementation baseline: `de73c527e5bcffc8f626414b6a6d6bd472b622d0`
- Initial successful [Pages deployment](https://github.com/novakai-one/ai-authored-educational-experiences/actions/runs/37757781764) and the hosted screenshots below use that baseline. Later publication changes update documentation and declare an empty favicon; they do not change the renderer, computation, specification or approvals.
- Future deployments are manual from `main`, using [Deploy preview](https://github.com/novakai-one/ai-authored-educational-experiences/actions/workflows/pages.yml). Each successful run records the exact deployed commit.

## Verification

`npm ci` and `npm run check` passed on macOS with Node.js 24.13.0, after installing the lockfile's Chromium version. The checks cover schema generation, content validation, copy boundaries, TypeScript, the production build, 36 contract/ownership tests and 7 headless browser tests. The first local attempt could not launch because that Chromium version was absent; installation resolved it without changing application code.

The suite verifies specification-only changes to text, mathematics and feedback; explicit failure for unsupported interactions/components; approval hash enforcement; all five feedback outcomes; branching, completion and reset behavior; keyboard interaction; reduced motion; and mobile overflow/accessibility checks.

The actual HTTPS deployment was opened in a headless browser at desktop 1440×1200 and mobile 390×844 sizes. It displayed the placeholder notice, exact specification text, matrix and initial `(2, 1)` → `(4, 1)` coordinates. Submitting `(4, 1)` displayed the specified success feedback; Continue reached the authored completion; restart restored empty answers. The mobile page had `scrollWidth = innerWidth = 390`, with reduced motion enabled.

- [Hosted desktop](hosted-desktop.png)
- [Hosted authored feedback](hosted-feedback.png)
- [Hosted mobile](hosted-mobile.png)

The raw JSON fetched from the public Pages URL matched the local source byte for byte:

```text
620d422053d5564e95d360f15ae049b4b72359081fd5ecf7bc0a6e9213ed2429
```

The protected-content diff against the baseline is empty. `npm run guard:diff` and `git diff --check` passed. No files in `public/experiences/` or `authoring/` were changed during publication completion.

## Repository safeguards verified through GitHub

Pages uses GitHub Actions. The active `main` protection requires PRs, passing `verify` and `content-boundary` checks with an up-to-date branch, and resolution of review conversations. Rules apply to administrators. Force pushes and deletion are disabled; stale reviews are dismissed.

Approval count is zero and code-owner approval is not mandatory because the current workflow uses a single GitHub identity. This avoids an impossible self-approval requirement; it does not supply independent author approval. ChatGPT's explicit review record remains a workflow obligation. Add a distinct reviewer and mandatory code-owner approval if independent account enforcement is needed.

## Whole-output review findings and repairs

| Concrete finding | Repair / outcome |
| --- | --- |
| Repository creation and Pages setup were blocked by the cloud integration's permissions. | Used the existing published repository and the owner's local administrative access; enabled Pages and verified a successful public deployment. |
| README and earlier evidence still described Pages and branch protection as unavailable. | Updated them to the verified settings, public URL and manual deployment procedure. |
| The earlier evidence linked a long-running initial CI attempt rather than the successful run for the same commit. | Replaced that link with the completed successful run and cancelled the obsolete attempt. |
| Authoring instructions assumed that a connected GitHub session could commit files. | Added an explicit branch/file-write prerequisite and an exact-file human handoff for sessions without write tools; no claim that repository setup grants ChatGPT permissions. |
| The hosted browser requested `/favicon.ico` from the account site and received 404. | Added an empty data favicon in `index.html`, removing that unnecessary request without adding educational visuals or copy. |
| Passing tests alone would not establish that a reviewer can reach a working preview. | Exercised the actual HTTPS page, inspected whole desktop/mobile screenshots, completed the activity and checked the published JSON hash. |

## Requirement coverage and remaining boundary

The canonical JSON files, strict schema and validation, React renderer, separate mathematical engine, literal-copy checks, approval manifest, branch ownership guard, authoring/implementation instructions, example activity, capabilities list, preview artifacts and hosted demonstration are in place. [AUTHORING.md](../../AUTHORING.md) is the entry point for ChatGPT; [INTERACTIONS.md](../INTERACTIONS.md) distinguishes supported interactions from extensions that require implementation.

The supported renderer remains deliberately small. ChatGPT must author the real experience and review implementation fidelity. Its authoring session must have working GitHub write tools to commit directly. Hashes and branch rules protect the workflow but do not authenticate which model wrote a file or establish that a lesson teaches effectively. No changes were made to `claude-ai-demo`.
