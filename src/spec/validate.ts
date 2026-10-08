import { experienceSchema, type Experience, type Step } from './schema';
import { extensions } from './extensions';
import { transform } from '../engine/math';

export function targets(step: Step): string[] {
  switch (step.kind) {
    case 'message': return [step.action.target];
    case 'completion': return step.restart ? [step.restart.target] : [];
    case 'vector-transform': return Object.values(step.answer.feedback).flatMap(f => f.action ? [f.action.target] : []);
    case 'custom': return step.actions.map(a => a.target);
  }
}

export function validateExperience(input: unknown): Experience {
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => `${i.path.join('.') || 'root'}: ${i.message}`).join('\n'));
  const spec = parsed.data;
  const issues: string[] = [];
  const check = (condition: boolean, path: string, message: string) => { if (!condition) issues.push(`${path}: ${message}`); };
  check(spec.status === 'approved' || Boolean(spec.notice), 'notice', 'placeholder and draft experiences require an authored notice');
  check(spec.status === 'placeholder' || spec.author === 'ChatGPT', 'author', 'only a placeholder may be attributed to development-fixture');
  const ids = new Set(spec.steps.map(s => s.id));
  check(ids.size === spec.steps.length, 'steps', 'duplicate step id');
  check(ids.has(spec.start), 'start', 'unknown starting step');
  spec.steps.forEach((step, i) => {
    const path = `steps.${i}`;
    targets(step).forEach(target => check(ids.has(target), path, `unknown transition target ${target}`));
    if (step.kind === 'custom') {
      const extension = extensions[step.component];
      check(Boolean(extension) && extension.version === step.version, path, `unsupported component ${step.component}@${step.version}; implementation required`);
      if (extension) {
        for (const [key, schema] of [['config', extension.configSchema], ['copy', extension.copySchema]] as const) {
          const result = schema.safeParse(step[key]);
          if (!result.success) issues.push(`${path}.${key}: ${result.error.message}`);
        }
      }
    }
    if (step.kind !== 'vector-transform') return;
    const { interaction: controls, visual: { domain }, initialVector, matrix } = step;
    check(controls.min < controls.max, path, 'slider minimum must be below maximum');
    check(controls.step <= controls.max - controls.min, path, 'slider step must fit its range');
    const isMultiple = (value: number) => Math.abs(value - Math.round(value)) < 1e-8;
    check(isMultiple((controls.max - controls.min) / controls.step), path, 'slider range must be a multiple of its step');
    check(initialVector.every(n => n >= controls.min && n <= controls.max && isMultiple((n - controls.min) / controls.step)), path, 'initial vector must be on the slider grid');
    check(domain.min < 0 && domain.max > 0, path, 'visual domain must include the origin');
    check((domain.max - domain.min) / domain.tick <= 40, path, 'visual supports at most 40 tick intervals');
    check(isMultiple((domain.max - domain.min) / domain.tick), path, 'visual domain must be a multiple of its tick');
    const inDomain = (n: number) => Number.isFinite(n) && n >= domain.min && n <= domain.max;
    check([controls.min, controls.max].every(inDomain), path, 'visual domain must contain all input vectors');
    for (const x of [controls.min, controls.max]) for (const y of [controls.min, controls.max]) {
      check(transform(matrix, [x, y]).every(inDomain), path, 'visual domain would clip a transformed vector; author must specify a larger domain');
    }
  });
  const reachable = new Set<string>();
  const visit = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    const step = spec.steps.find(s => s.id === id);
    if (step) targets(step).forEach(visit);
  };
  visit(spec.start);
  check(spec.steps.every(s => reachable.has(s.id)), 'steps', 'unreachable step');
  const canFinish = new Set(spec.steps.filter(s => s.kind === 'completion').map(s => s.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of spec.steps) if (!canFinish.has(step.id) && targets(step).some(t => canFinish.has(t))) {
      canFinish.add(step.id); changed = true;
    }
  }
  check(spec.steps.every(s => canFinish.has(s.id)), 'steps', 'each step must have a path to a completion step');
  if (issues.length) throw new Error(issues.join('\n'));
  return spec;
}
