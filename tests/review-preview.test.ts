import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleReviewPreview } from '../scripts/review-preview';

it('keeps old commit URLs byte-identical, updates the alias, and leaves the stable root unchanged', async () => {
  const root = await mkdtemp(join(tmpdir(), 'alignment-preview-'));
  try {
    const stable = join(root, 'stable'); const review = join(root, 'review');
    await mkdir(stable); await mkdir(review);
    await writeFile(join(stable, 'index.html'), 'stable main');
    await writeFile(join(review, 'index.html'), 'first review');
    const first = 'a'.repeat(40); const second = 'b'.repeat(40);
    const url = 'https://example.test/previews/eigenvector-alignment-lab/';
    await assembleReviewPreview(stable, review, first, url, async () => new Response('', { status: 404 }));
    const hosted = join(stable, 'previews/eigenvector-alignment-lab');
    const history = await readFile(join(hosted, 'history.json'), 'utf8');
    const snapshot = await readFile(join(hosted, first, 'snapshot.json'), 'utf8');
    const fetcher: typeof fetch = async request => new Response(String(request).endsWith('history.json') ? history : snapshot);
    await rm(hosted, { recursive: true }); // A Pages deployment starts with a fresh main build.
    await writeFile(join(review, 'index.html'), 'second review');
    await assembleReviewPreview(stable, review, second, url, fetcher);
    expect(await readFile(join(stable, 'index.html'), 'utf8')).toBe('stable main');
    expect(await readFile(join(hosted, first, 'index.html'), 'utf8')).toBe('first review');
    expect(await readFile(join(hosted, second, 'index.html'), 'utf8')).toBe('second review');
    expect(await readFile(join(hosted, 'index.html'), 'utf8')).toBe('second review');
    await expect(assembleReviewPreview(stable, review, first, url, fetcher)).rejects.toThrow('Refusing to replace');
    await expect(assembleReviewPreview(stable, review, second, url, async () => new Response('', { status: 503 }))).rejects.toThrow('Cannot preserve');
  } finally { await rm(root, { recursive: true, force: true }); }
});
