import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha = /^[a-f0-9]{40}$/;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
interface Snapshot { commit: string; files: { path: string; base64: string }[] }
interface HistoryEntry { commit: string; digest: string }
async function filesFrom(directory: string, prefix = ''): Promise<Snapshot['files']> {
  const files: Snapshot['files'] = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesFrom(directory, path + '/'));
    else if (entry.isFile()) files.push({ path, base64: (await readFile(join(directory, path))).toString('base64') });
    else throw new Error('Preview contains an unsupported file type');
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
function validateSnapshot(value: Snapshot, commit: string) {
  if (value.commit !== commit || !Array.isArray(value.files) || !value.files.length) throw new Error('Invalid preview snapshot');
  const paths = new Set<string>();
  for (const file of value.files) {
    if (typeof file.path !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(file.path) || file.path.split('/').some(part => !part || part === '.' || part === '..') || file.path === 'snapshot.json' || paths.has(file.path) || typeof file.base64 !== 'string' || Buffer.from(file.base64, 'base64').toString('base64') !== file.base64) throw new Error('Invalid preview file');
    paths.add(file.path);
  }
}

// Carry forward previously deployed versions so publishing a new review does not break old review URLs.
export async function assembleReviewPreview(stable: string, review: string, commit: string, previousUrl: string, fetcher: typeof fetch = fetch) {
  if (!sha.test(commit)) throw new Error('Expected a full implementation commit SHA');
  const root = join(stable, 'previews/eigenvector-alignment-lab');
  await mkdir(root, { recursive: true });
  const response = await fetcher(new URL('history.json', previousUrl));
  if (!response.ok && response.status !== 404) throw new Error(`Cannot preserve preview history: HTTP ${response.status}`);
  const previous: HistoryEntry[] = response.ok ? await response.json() : [];
  if (!Array.isArray(previous) || previous.some(item => !sha.test(item.commit) || !/^[a-f0-9]{64}$/.test(item.digest)) || new Set(previous.map(item => item.commit)).size !== previous.length) throw new Error('Invalid preview history');
  for (const entry of previous) {
    const archive = await fetcher(new URL(`${entry.commit}/snapshot.json`, previousUrl));
    if (!archive.ok) throw new Error(`Cannot preserve preview ${entry.commit}`);
    const text = await archive.text();
    if (digest(text) !== entry.digest) throw new Error('Preview history checksum mismatch');
    const snapshot: Snapshot = JSON.parse(text); validateSnapshot(snapshot, entry.commit);
    for (const file of snapshot.files) {
      const path = join(root, entry.commit, file.path);
      await mkdir(join(path, '..'), { recursive: true });
      await writeFile(path, Buffer.from(file.base64, 'base64'));
    }
    await writeFile(join(root, entry.commit, 'snapshot.json'), text);
  }
  const snapshot: Snapshot = { commit, files: await filesFrom(review) };
  validateSnapshot(snapshot, commit);
  const text = JSON.stringify(snapshot);
  const existing = previous.find(entry => entry.commit === commit);
  if (existing && existing.digest !== digest(text)) throw new Error('Refusing to replace a commit-specific preview with different content');
  await cp(review, root, { recursive: true });
  await cp(review, join(root, commit), { recursive: true });
  await writeFile(join(root, commit, 'snapshot.json'), text);
  await writeFile(join(root, 'history.json'), JSON.stringify([...previous.filter(entry => entry.commit !== commit), { commit, digest: digest(text) }], null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [stable, review, commit, previousUrl] = process.argv.slice(2);
  if (!stable || !review || !commit || !previousUrl) throw new Error('Expected stable directory, review directory, commit and previous preview URL');
  await assembleReviewPreview(stable, review, commit, previousUrl);
}
