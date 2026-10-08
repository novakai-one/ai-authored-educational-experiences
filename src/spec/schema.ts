import { z } from 'zod';

const text = z.string().min(1);
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const number = z.number().finite();
const vector = z.tuple([number, number]);
const action = z.strictObject({ label: text, target: id });
const body = z.array(text).min(1);
const feedback = z.strictObject({ text, action: action.optional() });
const common = { id, title: text, body };

export const outcomes = ['invalid', 'correct', 'x-correct', 'y-correct', 'incorrect'] as const;
export type Outcome = typeof outcomes[number];

export const vectorStepSchema = z.strictObject({
  ...common,
  kind: z.literal('vector-transform'),
  matrix: z.tuple([vector, vector]),
  initialVector: vector,
  interaction: z.strictObject({
    kind: z.literal('coordinate-sliders'),
    min: number, max: number, step: number.positive(),
    xLabel: text, yLabel: text,
  }),
  visual: z.strictObject({
    kind: z.literal('vector-plane'),
    title: text, description: text,
    domain: z.strictObject({ min: number, max: number, tick: number.positive() }),
    sourceLabel: text, resultLabel: text,
    sourceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    resultColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    matrixLabel: text, xAxisLabel: text, yAxisLabel: text,
    animation: z.strictObject({
      trigger: z.literal('on-input'),
      durationMs: z.number().int().min(0).max(5000),
      easing: z.enum(['linear', 'ease-in-out']),
      reducedMotion: z.literal('instant'),
    }),
  }),
  answer: z.strictObject({
    kind: z.literal('transformed-vector'),
    prompt: text, xLabel: text, yLabel: text, submitLabel: text,
    tolerance: number.min(0).max(1),
    feedback: z.strictObject({
      invalid: feedback, correct: feedback,
      'x-correct': feedback, 'y-correct': feedback, incorrect: feedback,
    }),
  }),
});

// A request for an extension is expressible before the implementation exists.
// Validation requires an installed, exact-version contract. No fallback renderer.
export const customStepSchema = z.strictObject({
  ...common, kind: z.literal('custom'), component: id, version: z.number().int().positive(),
  copy: z.record(z.string().regex(/^[a-z][A-Za-z0-9-]*$/), text), config: z.json(),
  actions: z.array(action),
});

export const experienceSchema = z.strictObject({
  $schema: z.string().optional(),
  schemaVersion: z.literal(1),
  id,
  status: z.enum(['placeholder', 'draft', 'approved']),
  author: z.enum(['ChatGPT', 'development-fixture']),
  title: text,
  locale: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/),
  notice: text.optional(),
  objectives: z.array(text).min(1),
  successCriteria: z.array(text).min(1),
  start: id,
  steps: z.array(z.discriminatedUnion('kind', [
    vectorStepSchema,
    z.strictObject({ ...common, kind: z.literal('message'), action }),
    z.strictObject({ ...common, kind: z.literal('completion'), restart: action.optional() }),
    customStepSchema,
  ])).min(1),
});

export type Experience = z.infer<typeof experienceSchema>;
export type Step = Experience['steps'][number];
export type VectorStep = z.infer<typeof vectorStepSchema>;
export type Vector = [number, number];
export type Matrix = [Vector, Vector];
