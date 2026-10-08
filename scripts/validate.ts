import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { validateExperience } from '../src/spec/validate';
import { approvalSchema, verifyApproval } from '../src/spec/approval';

const approvals = approvalSchema.parse(JSON.parse(readFileSync('authoring/approvals.json', 'utf8')));
const files = readdirSync('public/experiences').filter(f => f.endsWith('.json')).sort();
const seen = new Set<string>();
let failed = false;
for (const file of files) {
  try {
    const raw = readFileSync(`public/experiences/${file}`, 'utf8');
    const spec = validateExperience(JSON.parse(raw));
    if (file !== `${spec.id}.json`) throw new Error('filename must match specification id');
    if (seen.has(spec.id)) throw new Error('duplicate experience id');
    seen.add(spec.id);
    verifyApproval(spec, createHash('sha256').update(raw).digest('hex'), approvals);
    console.log(`VALID ${file} [${spec.status}]`);
  } catch (error) { failed = true; console.error(`INVALID ${file}\n${error instanceof Error ? error.message : error}`); }
}
for (const id of Object.keys(approvals.approved)) {
  if (!seen.has(id)) { failed = true; console.error(`Approval points to missing or invalid experience: ${id}`); }
}
if (!files.length) { failed = true; console.error('No experience specifications found'); }
if (failed) process.exitCode = 1;
