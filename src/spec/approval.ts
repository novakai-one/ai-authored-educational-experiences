import { z } from 'zod';
import type { Experience } from './schema';

export const approvalSchema = z.strictObject({
  schemaVersion: z.literal(1),
  approved: z.record(z.string(), z.strictObject({
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    reviewer: z.literal('ChatGPT'),
    reviewReference: z.string().min(1),
  })),
});

export function verifyApproval(spec: Experience, digest: string, manifest: unknown) {
  const approvals = approvalSchema.parse(manifest);
  const approval = approvals.approved[spec.id];
  if (spec.status === 'approved' && (!approval || approval.sha256 !== digest)) {
    throw new Error(`${spec.id}: approved specification has no matching author approval hash`);
  }
  if (spec.status !== 'approved' && approval) {
    throw new Error(`${spec.id}: an approval exists but the specification is not marked approved`);
  }
}
