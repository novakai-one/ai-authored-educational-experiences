# Collaboration workflow

| Stage | Owner | Branch / files | Output |
| --- | --- | --- | --- |
| Author | ChatGPT | `authoring/<id>`; `public/experiences/`, `authoring/` | Complete specification, explicit draft notice, authoring PR |
| Approve and freeze | ChatGPT | Same branch | Approved byte hash, authoring commit SHA, handoff |
| Implement | Codex / Claude Code | `implementation/<id>` from frozen authoring commit | Code and tests; no protected content changes |
| Demonstrate | Implementer | Implementation PR targeting authoring branch | Working preview artifact, screenshots, checks and spec hash |
| Review | ChatGPT | PR review and `authoring/reviews/` | Fidelity decision; educational review remains separate |
| Correct and integrate | Implementer, then author/maintainer | Code-only corrections, then merge | Faithful implementation with intact authored content |

## Separate checkouts and fixed ownership

```sh
git fetch origin
git switch authoring/my-activity
git rev-parse HEAD
# Record that exact commit as AUTHORING_COMMIT in the implementation PR.
git worktree add ../implement-my-activity -b implementation/my-activity <AUTHORING_COMMIT>
cd ../implement-my-activity
npm ci
```

The author freezes content for this implementation pass. The implementer never edits `public/experiences/` or `authoring/`, including approvals. Do not share a working checkout between agents. Coordinate new educational changes as a new authoring commit, then rebase implementation and verify that its protected files exactly match the new author baseline.

The implementation PR targets `authoring/my-activity`, not `main`; its protected-content diff must be empty. Before review:

```sh
BASE_REF=<AUTHORING_COMMIT> npm run guard:diff
npm run check
git diff <AUTHORING_COMMIT> -- public/experiences authoring
```

## Unsupported specifications

The authoring PR may initially fail validation because it requests an unimplemented custom component. Keep that failure visible and the PR unmerged. Implement the explicit extension on the implementation branch; once tests and fidelity review pass, merge its code-only PR into the authoring branch. The authoring PR can then pass and be reviewed for merging to `main`.

The diff guard permits an authoring branch to contain separate content commits and implementation commits, but rejects any individual commit mixing those responsibilities. Keep authoring commits and implementation commits separate when integrating; a mixed squash commit into the authoring branch will fail the guard. The initial repository bootstrap is the sole pre-workflow exception.

If the request cannot be implemented as specified, report its file/JSON path, the exact behavior at issue, and technical alternatives. The implementer must not choose the educational compromise.

## Evidence and author review

The PR template asks for authoring commit, implementation commit, exact spec hash, preview location, tests, visual/interaction evidence, deviations and unsupported requirements. The CI `preview-dist` artifact is a working static preview of that run; `implementation-evidence` contains the browser report, screenshots and traces on failure. The author reviews every branch and state, including accessibility and reduced motion.

ChatGPT records an implementation-fidelity decision in a PR review or `authoring/reviews/<id>.md`, including the reviewed implementation commit and spec hash. The implementer cannot make that decision. Any educational content change returns to authoring and requires a fresh hash; a code correction keeps the content intact. An implementation review does not automatically establish educational effectiveness.

## GitHub enforcement

`CODEOWNERS` directs review of content and integrity controls to the repository owner, who is the human custodian of the ChatGPT authoring process. ChatGPT is not a GitHub team or separately authenticated identity.

After publication, configure a `main` branch rule requiring PRs, the `verify` and `content-boundary` checks, and resolution of review conversations. If distinct reviewer accounts are available, also require code-owner review and dismiss stale approvals. A single GitHub user cannot approve their own PR; do not claim a self-review is an independent approval. Record ChatGPT's review explicitly even when both agents use the same GitHub account.

These server-side settings require repository administration and are not enabled merely by committing `CODEOWNERS`. Keep force-push and deletion disabled for protected branches. The repository documentation and CI are review safeguards, not proof of which model authored a change.
