import type { Matrix, Outcome, Vector } from '../spec/schema';

export function transform(matrix: Matrix, vector: Vector): Vector {
  return matrix.map(row => row[0] * vector[0] + row[1] * vector[1]) as Vector;
}

export function parseNumber(raw: string): number | null {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

// Returns facts only. No explanations, hints, or implicit educational routing.
export function evaluate(raw: [string, string], expected: Vector, tolerance: number): Outcome {
  const x = parseNumber(raw[0]);
  const y = parseNumber(raw[1]);
  if (x === null || y === null) return 'invalid';
  const xCorrect = Math.abs(x - expected[0]) <= tolerance;
  const yCorrect = Math.abs(y - expected[1]) <= tolerance;
  if (xCorrect && yCorrect) return 'correct';
  if (xCorrect) return 'x-correct';
  if (yCorrect) return 'y-correct';
  return 'incorrect';
}
