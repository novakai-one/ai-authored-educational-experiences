import { execFileSync } from 'node:child_process';

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const base = process.env.BASE_REF || process.argv[2] || 'origin/main';
const branch = process.env.HEAD_BRANCH || git('branch', '--show-current');
const protectedPath = (p: string) => p.startsWith('public/experiences/') || p.startsWith('authoring/');
const implementationPath = (p: string) => /^(src|scripts|schema|tests|\.github)\//.test(p) || /^(package.*json|.*config\.ts)$/.test(p);
// Implementation must match the exact author baseline, including new author
// commits on the PR base. A merge-base comparison would miss that drift.
const comparison = branch.startsWith('authoring/') ? [`${base}...HEAD`] : [base, 'HEAD'];
const changed = git('diff', '--name-only', ...comparison).split('\n').filter(Boolean);
const contentChanges = changed.filter(protectedPath);
if (!branch.startsWith('authoring/') && contentChanges.length) {
  throw new Error(`Only an authoring/* branch may change protected specifications or approvals.\n${contentChanges.join('\n')}`);
}
if (branch.startsWith('authoring/')) {
  // An authoring branch may receive an implementation PR. Keep each commit's
  // responsibilities separate, even when the complete reviewed branch is merged.
  const commits = git('rev-list', '--no-merges', `${base}..HEAD`).split('\n').filter(Boolean);
  for (const commit of commits) {
    const paths = git('diff-tree', '--no-commit-id', '--name-only', '-r', commit).split('\n');
    if (paths.some(protectedPath) && paths.some(implementationPath)) throw new Error(`${commit}: mixes educational specifications and implementation. Split the commits and preserve authorship.`);
  }
}
console.log(`${branch}: protected-content diff policy passed against ${base}`);
