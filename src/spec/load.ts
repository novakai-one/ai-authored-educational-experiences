import approvals from '../../authoring/approvals.json';
import { validateExperience } from './validate';
import { verifyApproval } from './approval';

export async function loadExperience(search: string, signal: AbortSignal) {
  const id = new URLSearchParams(search).get('experience') ?? 'linear-algebra-demo';
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Invalid experience identifier');
  const response = await fetch(`${import.meta.env.BASE_URL}experiences/${id}.json`, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`Specification request failed: HTTP ${response.status}`);
  const raw = await response.text();
  const spec = validateExperience(JSON.parse(raw));
  if (spec.id !== id) throw new Error('Specification id does not match its filename');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const digest = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
  verifyApproval(spec, digest, approvals);
  return spec;
}
