import { readdirSync, readFileSync } from 'node:fs';
import { checkCopy } from './copy-policy';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
}
const checked = files('src').filter(f => f.endsWith('.tsx') && f !== 'src/diagnostics.tsx');
const errors = checked.flatMap(f => checkCopy(readFileSync(f, 'utf8'), f));
for (const file of files('src').filter(f => f.endsWith('.css'))) {
  if (/content\s*:\s*['"][^'"]*[a-z]/i.test(readFileSync(file, 'utf8'))) errors.push(`${file}: generated CSS copy is forbidden`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Copy boundary checked in ${checked.length} rendering modules. Manual fidelity review is still required.`);
