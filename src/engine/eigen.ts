import type { Matrix, Vector } from '../spec/schema';
import type { MissionConfig } from '../spec/eigenMission';
import { transform } from './math';

export const sameVector = (a: Vector, b: Vector, tolerance = 0) => a.every((n, i) => Math.abs(n - b[i]) <= tolerance);
export function eigenvalue(matrix: Matrix, vector: Vector): number | null {
  if (vector.every(n => n === 0)) return null;
  const output = transform(matrix, vector);
  const axis = Math.abs(vector[0]) >= Math.abs(vector[1]) ? 0 : 1;
  const scale = output[axis] / vector[axis];
  return Number.isFinite(scale) && sameVector(output, [scale * vector[0], scale * vector[1]], 1e-10) ? scale : null;
}

// The authored contract accepts signed decimals, not expressions or exponents.
export function parseDecimal(raw: string): number | null {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw.trim())) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export interface MissionAnswer {
  choice: string;
  numbers: string[];
  selected: string[];
  scales: Record<string, string>;
  vector: Vector;
}
export interface PhaseAssessment { attemptCount: number; hintUsed: boolean; isCorrect: boolean }
export interface MissionAssessment extends PhaseAssessment { phases: Record<string, PhaseAssessment> }
export function missionPhases(config: MissionConfig): readonly string[] {
  return 'answerSequence' in config ? config.answerSequence : [config.mode];
}
export const binaryAnswerValues = ['yes', 'no'] as const;
export function initialAnswer(config: MissionConfig): MissionAnswer {
  return { choice: '', numbers: ['', '', ''], selected: [], scales: {}, vector: config.mode === 'hunt-direction' ? config.initialVector : [0, 0] };
}

// Keys identify authored responses; no learner-facing prose is generated here.
export function evaluateMission(config: MissionConfig, answer: MissionAnswer, phase = 0): { key: string; correct: boolean } {
  const result = (key: string, correct = false) => ({ key, correct });
  const success = () => result('feedbackCorrect', true);
  const values = answer.numbers.map(parseDecimal);
  switch (config.mode) {
    case 'predict-output':
    case 'classify-line':
      return result('feedback' + answer.choice.toUpperCase(), answer.choice === config.correctId);
    case 'hunt-direction':
      if (answer.vector.every(n => n === 0)) return result('feedbackZero');
      return eigenvalue(config.matrix, answer.vector) === null ? result('feedbackTurned') : success();
    case 'calculate-output': {
      if (values[0] === null || values[1] === null) return result('feedbackInvalid');
      const expected = transform(config.matrix, config.vector);
      const x = Math.abs(values[0] - expected[0]) <= config.tolerance;
      const y = Math.abs(values[1] - expected[1]) <= config.tolerance;
      return x && y ? success() : result(x ? 'feedbackXOnly' : y ? 'feedbackYOnly' : 'feedbackNeither');
    }
    case 'classify-and-scale':
      if (phase === 0) {
        if (!['yes', 'no'].includes(answer.choice)) return result('feedbackInvalid');
        return (answer.choice === 'yes') === config.lineAnswer ? result('lineCorrectText', true) : result('feedbackWrongLine');
      }
      if (values[0] === null) return result('feedbackInvalidMultiplier');
      if (values[0] > 0 && config.scaleAnswer < 0) return result('feedbackPositiveScale');
      return Math.abs(values[0] - config.scaleAnswer) <= config.tolerance ? success() : result('feedbackWrongScale');
    case 'two-directions': {
      const selected = answer.selected;
      if (phase === 0) {
        if (selected.length !== 2 || new Set(selected).size !== 2 || selected.some(id => !config.candidates.some(c => c.id === id))) return result('feedbackInvalid');
        if (selected.includes('c')) return result('feedbackContainsC');
        if (selected.includes('d')) return result('feedbackContainsD');
        return result('directionCorrectText', true);
      }
      if (config.requiredIds.some(id => parseDecimal(answer.scales[id] ?? '') === null)) return result('feedbackInvalidMultipliers');
      for (const id of config.requiredIds) {
        const candidate = config.candidates.find(c => c.id === id)!;
        const scale = eigenvalue(config.matrix, candidate.vector)!;
        if (Math.abs(parseDecimal(answer.scales[id])! - scale) > config.tolerance) return result('feedbackWrongScale' + id.toUpperCase());
      }
      return success();
    }
    case 'exit-ticket': {
      const [a, b] = config.questions;
      if (phase === 0) {
        if (values[0] === null || values[1] === null) return result('feedbackInvalid');
        return sameVector(values.slice(0, 2) as Vector, transform(config.matrix, a.vector), config.tolerance) ? result('outputCorrectText', true) : result('feedbackWrongOutput');
      }
      if (phase === 1) {
        if (values[2] === null) return result('feedbackInvalid');
        return Math.abs(values[2] - eigenvalue(config.matrix, a.vector)!) <= config.tolerance ? result('scaleCorrectText', true) : result('feedbackWrongScale');
      }
      if (!['yes', 'no'].includes(answer.choice)) return result('feedbackInvalid');
      if ((answer.choice === 'yes') !== (eigenvalue(config.matrix, b.vector) !== null)) return result('feedbackWrongClassification');
      return success();
    }
  }
}
