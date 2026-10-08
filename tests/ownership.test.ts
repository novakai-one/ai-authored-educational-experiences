import { it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const runner = resolve('node_modules/tsx/dist/cli.mjs');
const guard = resolve('scripts/guard-diff.ts');

function sandbox(run: (repo: string, git: (...args: string[]) => string, commit: (files: Record<string, string>) => void) => void) {
  const repo = mkdtempSync(join(tmpdir(), 'authorship-guard-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = (files: Record<string, string>) => {
    for (const [path, value] of Object.entries(files)) writeFileSync(join(repo, path), value);
    git('add', '.'); git('commit', '-m', 'Test fixture');
  };
  try {
    git('init', '-b', 'main'); git('config', 'user.name', 'Test fixture'); git('config', 'user.email', 'fixture@example.invalid');
    mkdirSync(join(repo, 'public/experiences'), { recursive: true }); mkdirSync(join(repo, 'src'));
    commit({ 'public/experiences/fixture.json': '{}', 'src/fixture.ts': 'export {}' });
    run(repo, git, commit);
  } finally { rmSync(repo, { recursive: true, force: true }); }
}
function check(repo: string, branch: string, base = 'main') {
  return execFileSync(process.execPath, [runner, guard, base], {
    cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BASE_REF: base, HEAD_BRANCH: branch },
  });
}

it('accepts code-only implementation and blocks a protected-content edit', () => sandbox((repo, git, commit) => {
  git('switch', '-c', 'implementation/fixture');
  commit({ 'src/fixture.ts': 'export const fixture = 1;' });
  expect(check(repo, 'implementation/fixture')).toContain('passed');
  commit({ 'public/experiences/fixture.json': '{"changed":true}' });
  expect(() => check(repo, 'implementation/fixture')).toThrow();
}));

it('detects content drift even when the author baseline advanced on another branch', () => sandbox((repo, git, commit) => {
  git('switch', '-c', 'implementation/fixture');
  commit({ 'src/fixture.ts': 'export const fixture = 1;' });
  git('switch', 'main'); commit({ 'public/experiences/fixture.json': '{"newAuthorVersion":true}' });
  git('switch', 'implementation/fixture');
  expect(() => check(repo, 'implementation/fixture')).toThrow();
}));

it('allows separate authoring and implementation commits, rejects a mixed commit', () => sandbox((repo, git, commit) => {
  git('switch', '-c', 'authoring/fixture');
  commit({ 'public/experiences/fixture.json': '{"authored":true}' });
  commit({ 'src/fixture.ts': 'export const fixture = 1;' });
  expect(check(repo, 'authoring/fixture')).toContain('passed');
  commit({ 'public/experiences/fixture.json': '{"mixed":true}', 'src/fixture.ts': 'export const fixture = 2;' });
  expect(() => check(repo, 'authoring/fixture')).toThrow();
}));
