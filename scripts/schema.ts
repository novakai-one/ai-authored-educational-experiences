import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { experienceSchema } from '../src/spec/schema';
import { missionConfigSchema, missionCopySchema } from '../src/spec/eigenMission';

for (const [target, schema] of [
  ['schema/experience.schema.json', experienceSchema],
  ['schema/eigen-mission.config.schema.json', missionConfigSchema],
  ['schema/eigen-mission.copy.schema.json', missionCopySchema],
] as const) {
  const json = JSON.stringify(z.toJSONSchema(schema), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== json) throw new Error('Schema is stale. Run npm run schema and review the contract diff.');
  } else { mkdirSync('schema', { recursive: true }); writeFileSync(target, json); }
}
