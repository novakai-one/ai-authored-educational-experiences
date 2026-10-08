import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { experienceSchema } from '../src/spec/schema';

const target = 'schema/experience.schema.json';
const json = JSON.stringify(z.toJSONSchema(experienceSchema), null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== json) throw new Error('Schema is stale. Run npm run schema and review the contract diff.');
} else { mkdirSync('schema', { recursive: true }); writeFileSync(target, json); }
