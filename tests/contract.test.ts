import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { validateExperience } from '../src/spec/validate';
import { verifyApproval } from '../src/spec/approval';
import { evaluate, parseNumber, transform } from '../src/engine/math';
import { checkCopy } from '../scripts/copy-policy';

const raw = readFileSync('public/experiences/linear-algebra-demo.json', 'utf8');
const fresh = () => JSON.parse(raw);
describe('specification boundary', () => {
  it('accepts the explicitly unapproved fixture', () => expect(validateExperience(fresh()).status).toBe('placeholder'));
  it.each([
    ['unknown interaction', (s: any) => { s.steps[0].interaction.kind = 'drag-vector'; }],
    ['unknown field', (s: any) => { s.steps[0].visual.explain = true; }],
    ['unsupported animation', (s: any) => { s.steps[0].visual.animation.easing = 'bounce'; }],
    ['missing feedback', (s: any) => { delete s.steps[0].answer.feedback.invalid; }],
    ['missing transition target', (s: any) => { s.steps[0].answer.feedback.correct.action.target = 'missing'; }],
    ['duplicate step', (s: any) => { s.steps.push(s.steps[0]); }],
    ['unreachable step', (s: any) => { s.steps.push({ ...s.steps[2], id: 'orphan' }); }],
    ['trap without completion', (s: any) => { s.steps[0].answer.feedback.correct.action.target = 'transform'; }],
    ['clipped output', (s: any) => { s.steps[0].matrix[0][0] = 100; }],
    ['off-grid initial value', (s: any) => { s.steps[0].initialVector[0] = 0.2; }],
    ['missing placeholder notice', (s: any) => { delete s.notice; }],
    ['false author provenance', (s: any) => { s.status = 'approved'; }],
    ['unsupported custom component', (s: any) => { s.steps[0] = { id: 'transform', title: 'Fixture', body: ['Fixture'], kind: 'custom', component: 'unbuilt', version: 1, config: {}, copy: {}, actions: [{ label: 'Fixture', target: 'complete' }, { label: 'Fixture', target: 'fixture-note' }] }; }],
  ])('rejects %s', (_, change) => { const spec = fresh(); change(spec); expect(() => validateExperience(spec)).toThrow(); });
  it('does not rewrite whitespace, punctuation, or Unicode', () => {
    const spec = fresh(); spec.steps[0].body = ['  An exact line.\nAnother — π ≠ 0.  '];
    expect(validateExperience(spec).steps[0].body).toEqual(spec.steps[0].body);
  });
  it('requires an exact-byte approval hash', () => {
    const input = fresh(); input.author = 'ChatGPT'; input.status = 'approved';
    const spec = validateExperience(input);
    const bytes = JSON.stringify(input);
    const hash = createHash('sha256').update(bytes).digest('hex');
    const manifest = { schemaVersion: 1, approved: { [spec.id]: { sha256: hash, reviewer: 'ChatGPT', reviewReference: 'test fixture only' } } };
    expect(() => verifyApproval(spec, hash, manifest)).not.toThrow();
    expect(() => verifyApproval(spec, '0'.repeat(64), manifest)).toThrow('approval hash');
    expect(() => verifyApproval(spec, hash, { schemaVersion: 1, approved: {} })).toThrow('approval hash');
  });
});

describe('computation is separate from communication', () => {
  it('computes a general 2 by 2 transformation', () => expect(transform([[2, -1], [3, 4]], [-2, 5])).toEqual([-9, 14]));
  it.each([
    [['', '1'], 'invalid'], [['NaN', '1'], 'invalid'], [['Infinity', '1'], 'invalid'],
    [['4junk', '1'], 'invalid'], [['4', '1'], 'correct'], [['4', '9'], 'x-correct'],
    [['9', '1'], 'y-correct'], [['0', '0'], 'incorrect'], [['4.0005', '1'], 'correct'],
  ] as const)('maps %j to a fact (%s)', (answer, outcome) => expect(evaluate([...answer], [4, 1], 0.001)).toBe(outcome));
  it('accepts signed decimals and scientific notation, not arithmetic expressions', () => {
    expect(parseNumber(' -2.5e1 ')).toBe(-25);
    expect(parseNumber('2+2')).toBeNull();
  });
});

describe('copy regression guard', () => {
  it.each([
    '<p>Here is a new explanation.</p>',
    '<input aria-label="Hint" />',
    'const replacement = "Hint"; const view = <p>{replacement}</p>;',
    'const view = <p>{`Try ${value} again`}</p>;',
    '<div dangerouslySetInnerHTML={{ __html: copy }} />',
  ])('rejects unauthored communication: %s', source => expect(checkCopy(source).length).toBeGreaterThan(0));
  it('allows authored copy and technical attributes', () => expect(checkCopy('<button className="primary">{step.action.label}</button>')).toEqual([]));
});
