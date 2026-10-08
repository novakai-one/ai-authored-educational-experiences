import { z } from 'zod';
import { transform } from '../engine/math';
import { eigenvalue, sameVector } from '../engine/eigen';

const number = z.number().finite();
const vector = z.tuple([number, number]);
const matrix = z.tuple([vector, vector]);
const display = z.strictObject({
  coordinateRange: z.tuple([z.literal(-7), z.literal(7)]), tick: z.literal(1),
  sourceColor: z.literal('#087f8c'), outputColor: z.literal('#b94e20'),
  inputStyle: z.literal('solid'), outputStyle: z.literal('dashed'), commonOrigin: z.literal(true),
  directionGuide: z.literal('full-line-through-origin'), animationMs: z.literal(650),
  reducedMotion: z.literal('show-final-state-instantly'),
});
const common = { display, matrix };
const hidden = z.literal('after-correct-commit');
const candidate = <T extends string>(id: T) => z.strictObject({ id: z.literal(id), vector });
export const missionModes = ['predict-output', 'classify-line', 'hunt-direction', 'calculate-output', 'classify-and-scale', 'two-directions', 'exit-ticket'] as const;
const rawConfig = z.discriminatedUnion('mode', [
  z.strictObject({ ...common, mode: z.literal('predict-output'), vector,
    choices: z.tuple([candidate('a'), candidate('b'), candidate('c'), candidate('d')]),
    correctId: z.enum(['a', 'b', 'c', 'd']), resultVisibility: hidden,
    offerHintAfterAttempts: z.literal(1), revealGuideAfterSuccess: z.literal(true),
  }),
  z.strictObject({ ...common, mode: z.literal('classify-line'), vector,
    options: z.tuple([z.strictObject({ id: z.literal('a') }), z.strictObject({ id: z.literal('b') }), z.strictObject({ id: z.literal('c') })]),
    correctId: z.enum(['a', 'b', 'c']), resultVisibility: z.literal('initial'), directionGuideVisibility: z.literal('initial'),
  }),
  z.strictObject({ ...common, mode: z.literal('hunt-direction'), initialVector: vector,
    dragGrid: z.strictObject({ min: z.literal(-3), max: z.literal(3), step: z.literal(1), snap: z.literal(true), nonzeroForSuccess: z.literal(true) }),
    success: z.strictObject({ type: z.literal('parallel-nonzero'), includeOppositeDirection: z.literal(true) }),
    resultVisibility: z.literal('live'), directionGuideVisibility: z.literal('live'),
    inputMethods: z.tuple([z.literal('pointer-drag'), z.literal('keyboard-grid'), z.literal('coordinate-fields')]),
  }),
  z.strictObject({ ...common, mode: z.literal('calculate-output'), vector, correctVector: vector,
    tolerance: z.literal(0), acceptedNumberFormat: z.literal('signed-decimal'), resultVisibility: hidden,
    offerHintAfterAttempts: z.literal(1), workRows: matrix,
  }),
  z.strictObject({ ...common, mode: z.literal('classify-and-scale'), vector, resultVector: vector,
    lineAnswer: z.literal(true), scaleAnswer: number.negative(), tolerance: z.literal(0),
    resultVisibility: z.literal('initial'), directionGuideVisibility: z.literal('initial'),
    answerSequence: z.tuple([z.literal('same-line'), z.literal('scale')]),
  }),
  z.strictObject({ ...common, mode: z.literal('two-directions'),
    candidates: z.tuple([
      candidate('a').extend({ eigenvalue: number }), candidate('b').extend({ eigenvalue: number }),
      candidate('c').extend({ eigenvalue: z.null() }), candidate('d').extend({ eigenvalue: z.null() }),
    ]), requiredIds: z.tuple([z.literal('a'), z.literal('b')]), tolerance: z.literal(0),
    resultVisibility: hidden, offerHintAfterAttempts: z.literal(1),
    graphLayout: z.literal('four-small-multiples'), labelCandidatesWithCopyKeys: z.literal(true),
  }),
  z.strictObject({ ...common, mode: z.literal('exit-ticket'), questions: z.tuple([
    z.strictObject({ id: z.literal('a'), vector, answerVector: vector, answerEigenvalue: number }),
    z.strictObject({ id: z.literal('b'), vector, answerIsEigenvector: z.boolean(), actualResult: vector }),
  ]), tolerance: z.literal(0), resultVisibility: hidden, graphVisibility: hidden,
    offerHintAfterAttempts: z.literal(1), successRequires: z.tuple([z.literal('a-output'), z.literal('a-scale'), z.literal('b-classification')]),
  }),
]);
export type MissionConfig = z.infer<typeof rawConfig>;

export const missionConfigSchema = rawConfig.superRefine((c, ctx) => {
  const check = (ok: boolean, path: (string | number)[], message: string) => { if (!ok) ctx.addIssue({ code: 'custom', path, message }); };
  const checkResult = (v: [number, number], expected: [number, number], path: (string | number)[]) => check(sameVector(transform(c.matrix, v), expected), path, 'Contradicts matrix multiplication');
  let vectors: [number, number][] = [];
  if ('vector' in c) vectors = [c.vector];
  if (c.mode === 'predict-output') {
    const matches = c.choices.filter(choice => sameVector(choice.vector, transform(c.matrix, c.vector)));
    check(matches.length === 1 && matches[0].id === c.correctId, ['correctId'], 'Must identify the unique computed output');
  }
  if (c.mode === 'classify-line') {
    const out = transform(c.matrix, c.vector);
    const expected = sameVector(out, c.vector) ? 'c' : eigenvalue(c.matrix, c.vector) !== null ? 'a' : 'b';
    check(c.correctId === expected, ['correctId'], 'Contradicts the computed line classification');
  }
  if (c.mode === 'hunt-direction') {
    check(c.initialVector.every(n => Number.isInteger(n) && n >= -3 && n <= 3), ['initialVector'], 'Must be an integer grid point in -3..3');
    check(eigenvalue(c.matrix, c.initialVector) === null && c.initialVector.some(n => n !== 0), ['initialVector'], 'Must begin at a nonzero unsolved heading');
    vectors = [];
    for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) vectors.push([x, y]);
    check(vectors.some(v => eigenvalue(c.matrix, v) !== null), ['matrix'], 'Must have a solvable direction on the input grid');
  }
  if (c.mode === 'calculate-output') {
    checkResult(c.vector, c.correctVector, ['correctVector']);
    check(c.workRows.every((r, i) => sameVector(r, c.matrix[i])), ['workRows'], 'Work rows must match the matrix');
  }
  if (c.mode === 'classify-and-scale') {
    checkResult(c.vector, c.resultVector, ['resultVector']);
    check(eigenvalue(c.matrix, c.vector) === c.scaleAnswer, ['scaleAnswer'], 'Contradicts the computed eigenvalue');
  }
  if (c.mode === 'two-directions') {
    vectors = c.candidates.map(v => v.vector);
    c.candidates.forEach((v, i) => check(eigenvalue(c.matrix, v.vector) === v.eigenvalue && v.vector.some(n => n !== 0), ['candidates', i, 'eigenvalue'], 'Contradicts the computed eigendirection/eigenvalue'));
  }
  if (c.mode === 'exit-ticket') {
    const [a, b] = c.questions; vectors = [a.vector, b.vector];
    checkResult(a.vector, a.answerVector, ['questions', 0, 'answerVector']);
    check(eigenvalue(c.matrix, a.vector) === a.answerEigenvalue, ['questions', 0, 'answerEigenvalue'], 'Contradicts the computed eigenvalue');
    checkResult(b.vector, b.actualResult, ['questions', 1, 'actualResult']);
    check((eigenvalue(c.matrix, b.vector) !== null) === b.answerIsEigenvector, ['questions', 1, 'answerIsEigenvector'], 'Contradicts the computed classification');
  }
  for (const v of vectors) check([...v, ...transform(c.matrix, v)].every(n => Number.isFinite(n) && n >= -7 && n <= 7), ['display', 'coordinateRange'], 'Would clip an input or result vector');
});

const text = z.string().min(1);
const commonCopy = Object.fromEntries([
  'progressLabel', 'matrixLabel', 'inputLabel', 'outputLabel', 'graphLabel', 'graphDescription',
  'submitLabel', 'retryLabel', 'hintLabel', 'hintText', 'revealExplanation', 'a11yChoices', 'a11yReveal',
].map(key => [key, text]));
const copy = (keys: string[]) => z.strictObject({ ...commonCopy, ...Object.fromEntries(keys.map(key => [key, text])) });
export const missionCopySchemas = {
  'predict-output': copy(['question', 'choiceA', 'choiceB', 'choiceC', 'choiceD', 'feedbackA', 'feedbackB', 'feedbackC', 'feedbackD']),
  'classify-line': copy(['question', 'choiceA', 'choiceB', 'choiceC', 'feedbackA', 'feedbackB', 'feedbackC']),
  'hunt-direction': copy(['question', 'dragLabel', 'xCoordinateLabel', 'yCoordinateLabel', 'feedbackZero', 'feedbackTurned', 'feedbackCorrect']),
  'calculate-output': copy(['question', 'firstInputLabel', 'secondInputLabel', 'feedbackInvalid', 'feedbackXOnly', 'feedbackYOnly', 'feedbackNeither', 'feedbackCorrect']),
  'classify-and-scale': copy(['lineQuestion', 'choiceYes', 'choiceNo', 'scaleQuestion', 'scaleInputLabel', 'feedbackInvalid', 'feedbackWrongLine', 'feedbackPositiveScale', 'feedbackWrongScale', 'feedbackCorrect']),
  'two-directions': copy(['question', 'candidateA', 'candidateB', 'candidateC', 'candidateD', 'selectLabel', 'multiplierLabel', 'feedbackInvalid', 'feedbackContainsC', 'feedbackContainsD', 'feedbackWrongScaleA', 'feedbackWrongScaleB', 'feedbackCorrect']),
  'exit-ticket': copy(['partAQuestion', 'partAFirstInputLabel', 'partASecondInputLabel', 'partAScaleQuestion', 'partAScaleInputLabel', 'partBQuestion', 'partBYes', 'partBNo', 'feedbackInvalid', 'feedbackWrongOutput', 'feedbackWrongScale', 'feedbackWrongClassification', 'feedbackCorrect']),
};
export const missionCopySchema = z.union(Object.values(missionCopySchemas));
export function validateMissionStep(step: { config: unknown; copy: unknown; actions: unknown[] }) {
  const config = missionConfigSchema.parse(step.config);
  missionCopySchemas[config.mode].parse(step.copy);
  if (step.actions.length !== 1) throw new Error('eigen-mission@1 requires exactly one authored continuation');
}
