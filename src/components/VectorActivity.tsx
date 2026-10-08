import { useState, type FormEvent } from 'react';
import type { Outcome, Vector, VectorStep } from '../spec/schema';
import { evaluate, transform } from '../engine/math';
import { VectorPlane } from './VectorPlane';

export function VectorActivity({ step, navigate }: { step: VectorStep; navigate: (target: string) => void }) {
  const [source, setSource] = useState<Vector>(step.initialVector);
  const [answer, setAnswer] = useState<[string, string]>(['', '']);
  const [outcome, setOutcome] = useState<Outcome>();
  const result = transform(step.matrix, source);
  const feedback = outcome ? step.answer.feedback[outcome] : undefined;
  const controls = step.interaction;
  function check(event: FormEvent) { event.preventDefault(); setOutcome(evaluate(answer, result, step.answer.tolerance)); }
  return <div className="activity-grid">
    <VectorPlane step={step} source={source} result={result} />
    <div className="control-column">
      <section className="controls-card">
        <div className="matrix-row"><h3>{step.visual.matrixLabel}</h3><div className="matrix" role="group" aria-label={step.visual.matrixLabel}>{step.matrix.flat().map((n, i) => <span key={i}>{n}</span>)}</div></div>
        {([0, 1] as const).map(axis => <div className="slider-control" key={axis}>
          <label htmlFor={`${step.id}-slider-${axis}`}>{axis === 0 ? controls.xLabel : controls.yLabel}</label><output htmlFor={`${step.id}-slider-${axis}`}>{source[axis]}</output>
          <input id={`${step.id}-slider-${axis}`} type="range" min={controls.min} max={controls.max} step={controls.step} value={source[axis]} onChange={e => {
            const next: Vector = [...source]; next[axis] = Number(e.target.value); setSource(next); setOutcome(undefined); setAnswer(['', '']);
          }} />
        </div>)}
      </section>
      <form className="answer-card" onSubmit={check} noValidate>
        <fieldset><legend>{step.answer.prompt}</legend><div className="answer-inputs">
          {([0, 1] as const).map(axis => <label key={axis}>
            <span>{axis === 0 ? step.answer.xLabel : step.answer.yLabel}</span>
            <input type="text" inputMode="decimal" autoComplete="off" value={answer[axis]} aria-describedby={feedback ? `${step.id}-feedback` : undefined} onChange={e => {
              const next: [string, string] = [...answer]; next[axis] = e.target.value; setAnswer(next); setOutcome(undefined);
            }} />
          </label>)}
        </div></fieldset>
        <button type="submit">{step.answer.submitLabel}</button>
      </form>
      <div className="feedback" data-outcome={outcome}>
        <p id={`${step.id}-feedback`} role="status" aria-live="polite">{feedback?.text}</p>
        {feedback?.action && <button className="secondary" onClick={() => navigate(feedback.action!.target)}>{feedback.action.label}</button>}
      </div>
    </div>
  </div>;
}
