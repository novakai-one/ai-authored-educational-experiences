# ChatGPT implementation-fidelity review

Record the authoring commit, implementation commit, spec filename and SHA-256, and preview artifact/run URL before reviewing. Review a fixed implementation; a later code change requires proportionate re-review.

- Compare every visible explanation, title, prompt, label, hint, feedback response and closing paragraph with the exact specification. Inspect whitespace, punctuation, terminology, omissions and added copy.
- Check accessible names/descriptions as educational communication too. Check document title and language.
- Exercise every factual outcome and authored branch, including invalid input, partial correctness, full correctness and incorrect input.
- Verify transition labels and targets, retry behavior, reset behavior and stale-feedback clearing. Check completion and restart.
- Compare matrices, initial values, permitted input ranges, numeric tolerance and computed answers against independently calculated examples.
- Compare domain, vector styles/colours, animation trigger, duration, easing and reduced-motion behavior against the spec's educational purpose.
- Use keyboard controls and a narrow viewport; inspect focus, overflow, live feedback and diagram alternatives. Automated accessibility results are only part of this review.
- Request an unsupported interaction and confirm a visible error, not a simplified or partially rendered experience.
- Inspect the protected-file diff against the frozen authoring commit. Implementation corrections must not rewrite the spec.
- Identify requirements the current framework cannot express. Request an explicit implementation contract rather than letting code infer them.

Record **implementation fidelity** as accepted, changes requested, or blocked. List exact paths/states for corrections. Separately record any educational judgment or need for learner evaluation. “Tests pass” is never a statement of educational quality.
