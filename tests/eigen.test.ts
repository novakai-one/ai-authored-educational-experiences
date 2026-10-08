import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateExperience } from '../src/spec/validate';
import { missionConfigSchema, missionCopySchemas, type MissionConfig } from '../src/spec/eigenMission';
import { eigenvalue, parseDecimal, evaluateMission, initialAnswer } from '../src/engine/eigen';
import { transform } from '../src/engine/math';
import { checkCopy } from '../scripts/copy-policy';

const raw = JSON.parse(readFileSync('public/experiences/eigenvector-alignment-lab.json', 'utf8'));
const missions = raw.steps.filter((s: any) => s.kind === 'custom');
describe('frozen authoring contract', () => {
  it('accepts the unchanged seven-mode draft', () => expect(validateExperience(raw).steps).toHaveLength(9));
  for (const step of missions) {
    it(`${step.config.mode}: rejects each missing config and copy field and every unknown field`, () => {
      const schema = missionCopySchemas[step.config.mode as MissionConfig['mode']];
      for (const key of Object.keys(step.copy)) {
        const copy = { ...step.copy }; delete copy[key];
        expect(schema.safeParse(copy).success, key).toBe(false);
      }
      for (const key of Object.keys(step.config)) {
        const config = { ...step.config }; delete config[key];
        expect(missionConfigSchema.safeParse(config).success, key).toBe(false);
      }
      expect(schema.safeParse({ ...step.copy, feedbackInvented: 'no' }).success).toBe(false);
      expect(missionConfigSchema.safeParse({ ...step.config, ignoreMe: true }).success).toBe(false);
      expect(missionConfigSchema.safeParse({ ...step.config, display: { ...step.config.display, extra: 1 } }).success).toBe(false);
    });
  }
  it.each([
    [0, (s: any) => { s.config.correctId = 'd'; }],
    [0, (s: any) => { s.config.choices[1].vector = [4, 1]; }],
    [1, (s: any) => { s.config.correctId = 'a'; }],
    [2, (s: any) => { s.config.initialVector = [1, 0]; }],
    [2, (s: any) => { s.config.initialVector = [1, 0.5]; }],
    [3, (s: any) => { s.config.correctVector = [9, 9]; }],
    [3, (s: any) => { s.config.workRows[0][0] = 9; }],
    [4, (s: any) => { s.config.resultVector = [2, 0]; }],
    [4, (s: any) => { s.config.scaleAnswer = -1; }],
    [5, (s: any) => { s.config.candidates[0].eigenvalue = 2; }],
    [5, (s: any) => { s.config.candidates[2].vector = [2, 2]; }],
    [6, (s: any) => { s.config.questions[0].answerVector = [5, 0]; }],
    [6, (s: any) => { s.config.questions[0].answerEigenvalue = 2; }],
    [6, (s: any) => { s.config.questions[1].actualResult = [3, 3]; }],
    [6, (s: any) => { s.config.questions[1].answerIsEigenvector = true; }],
    [2, (s: any) => { s.config.matrix = [[10, 1], [0, 1]]; }],
    [0, (s: any) => { s.actions = []; }],
    [0, (s: any) => { s.copy = missions[1].copy; }],
    [0, (s: any) => { s.version = 2; }],
  ])('rejects contradictory or unsupported contract case %i', (index, mutate) => {
    const spec = structuredClone(raw); mutate(spec.steps[index + 1]);
    expect(() => validateExperience(spec)).toThrow();
  });
});

describe('independent matrix reasoning', () => {
  it('computes all authored results independently', () => {
    expect(transform([[2, 0], [0, 1]], [2, 1])).toEqual([4, 1]);
    expect(transform([[1, 1], [0, 1]], [2, 1])).toEqual([3, 1]);
    expect(transform([[-2, 0], [0, 1]], [1, 0])).toEqual([-2, 0]);
    expect(transform([[2, 1], [1, 2]], [1, 1])).toEqual([3, 3]);
    expect(transform([[2, 1], [1, 2]], [1, -1])).toEqual([1, -1]);
    expect(transform([[3, 0], [0, 2]], [2, 0])).toEqual([6, 0]);
    expect(transform([[3, 0], [0, 2]], [1, 1])).toEqual([3, 2]);
  });
  it('accepts zero eigenvalues, reversal and unchanged vectors; rejects zero inputs and turning', () => {
    expect(eigenvalue([[0, 0], [0, 2]], [1, 0])).toBe(0);
    expect(eigenvalue([[-2, 0], [0, 1]], [1, 0])).toBe(-2);
    expect(eigenvalue([[1, 1], [0, 1]], [-3, 0])).toBe(1);
    expect(eigenvalue([[1, 0], [0, 1]], [0, 0])).toBeNull();
    expect(eigenvalue([[3, 0], [0, 2]], [1, 1])).toBeNull();
  });
  it('the shear hunt succeeds exactly at nonzero horizontal grid points', () => {
    const c = missions[2].config;
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) {
      const answer = { ...initialAnswer(c), vector: [x, y] as [number, number] };
      expect(evaluateMission(c, answer).correct).toBe(x !== 0 && y === 0);
    }
  });
  it('only accepts finite signed decimal numerals', () => {
    for (const s of ['', ' ', 'NaN', 'Infinity', '1e0', '2+1', '0x3', '3,0']) expect(parseDecimal(s)).toBeNull();
    for (const s of ['3', '+3.0', ' 3. ', '03']) expect(parseDecimal(s)).toBe(3);
    expect(parseDecimal('-.5')).toBe(-0.5);
  });
  it('accepts two candidate choices in either order', () => {
    const c = missions[5].config;
    for (const selected of [['a', 'b'], ['b', 'a']]) expect(evaluateMission(c, { ...initialAnswer(c), selected, scales: { a: '3', b: '1' } }).correct).toBe(true);
  });
});

it('copy guard permits conditional technical roles, while rejecting conditional educational copy', () => {
  expect(checkCopy('<svg role={drag ? "group" : "img"} />')).toEqual([]);
  expect(checkCopy('<p>{ok ? "New teaching" : "New hint"}</p>').length).toBeGreaterThan(0);
  expect(checkCopy('<svg aria-label={ok ? "Answer revealed" : "Invented hint"} />').length).toBeGreaterThan(0);
});
