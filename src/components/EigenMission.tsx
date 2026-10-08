import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { CustomStep } from '../spec/extensions';
import { missionModes, type MissionConfig } from '../spec/eigenMission';
import { evaluateMission, initialAnswer, missionPhases, parseDecimal, binaryAnswerValues, type MissionAnswer, type MissionAssessment, type PhaseAssessment } from '../engine/eigen';
import { transform } from '../engine/math';
import type { Vector } from '../spec/schema';
import { MissionPlane } from './MissionPlane';
import { AuthoredText } from './AuthoredText';

export function EigenMission({ step, navigate, recordAssessment }: {
  step: CustomStep; navigate: (target: string) => void; recordAssessment?: (assessment: MissionAssessment) => void;
}) {
  const config = step.config as MissionConfig;
  const copy = step.copy;
  const id = useId();
  const phaseNames = missionPhases(config);
  const [phase, setPhase] = useState(0);
  const [answer, setAnswer] = useState(() => initialAnswer(config));
  const [vectorDraft, setVectorDraft] = useState(() => initialAnswer(config).vector.map(String));
  const [outcome, setOutcome] = useState<ReturnType<typeof evaluateMission>>();
  const [assessments, setAssessments] = useState<Record<string, PhaseAssessment>>(() => Object.fromEntries(phaseNames.map(name => [name, { attemptCount: 0, hintUsed: false, isCorrect: false }])));
  const current = assessments[phaseNames[phase]];
  const attemptCount = Object.values(assessments).reduce((sum, item) => sum + item.attemptCount, 0);
  const hintUsed = Object.values(assessments).some(item => item.hintUsed);
  const phaseCorrect = outcome?.correct === true;
  const solved = phaseCorrect && phase === phaseNames.length - 1;
  const stage = missionModes.indexOf(config.mode) + 1;
  const questionRef = useRef<HTMLLegendElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { recordAssessment?.({ attemptCount, hintUsed, isCorrect: solved, phases: assessments }); }, [assessments, solved]);
  useEffect(() => { if (phase > 0) questionRef.current?.focus(); }, [phase]);
  useEffect(() => {
    const feedback = feedbackRef.current;
    if (outcome && feedback && feedback.getBoundingClientRect().bottom > innerHeight) feedback.scrollIntoView(false);
  }, [outcome, solved]);
  function update(patch: Partial<MissionAnswer>) {
    if (phaseCorrect) return;
    if (patch.vector) setVectorDraft(patch.vector.map(String));
    setAnswer(previous => ({ ...previous, ...patch })); setOutcome(undefined);
  }
  function recordPhase(patch: Partial<PhaseAssessment>) {
    setAssessments(previous => ({ ...previous, [phaseNames[phase]]: { ...previous[phaseNames[phase]], ...patch } }));
  }
  function numberInput(index: number, label: string) {
    return <label className="mission-number"><span><AuthoredText text={label} /></span><input type="text" inputMode="decimal" autoComplete="off" title={label} value={answer.numbers[index]} onChange={event => {
      const numbers = [...answer.numbers]; numbers[index] = event.target.value; update({ numbers });
    }} /></label>;
  }
  function booleanChoices(yes: string, no: string) {
    return <div className="mission-choices">
      {binaryAnswerValues.map((value, i) => <label className="mission-choice" key={value} data-selected={answer.choice === value}>
        <input type="radio" name={id} checked={answer.choice === value} onChange={() => update({ choice: value })} /><span><AuthoredText text={i === 0 ? yes : no} /></span>
      </label>)}
    </div>;
  }
  const invalidDraft = config.mode === 'hunt-direction' && vectorDraft.some((value, axis) => parseDecimal(value) !== answer.vector[axis]);
  function submit(event: FormEvent) {
    event.preventDefault(); if (phaseCorrect || invalidDraft) return;
    if ((config.mode === 'predict-output' || config.mode === 'classify-line') && !answer.choice) return;
    const result = evaluateMission(config, answer, phase);
    recordPhase({ attemptCount: current.attemptCount + 1, isCorrect: result.correct });
    setOutcome(result);
  }
  const question = config.mode === 'classify-and-scale' ? (phase === 0 ? copy.lineQuestion : copy.scaleQuestion)
    : config.mode === 'two-directions' ? (phase === 0 ? copy.question : copy.multiplierQuestion)
    : config.mode === 'exit-ticket' ? [copy.partAQuestion, copy.partAScaleQuestion, copy.partBQuestion][phase]
    : copy.question;
  const submitLabel = config.mode === 'classify-and-scale' && phase === 0 ? copy.lineSubmitLabel
    : config.mode === 'two-directions' && phase === 0 ? copy.directionSubmitLabel
    : config.mode === 'exit-ticket' && phase < 2 ? [copy.outputSubmitLabel, copy.scaleSubmitLabel][phase]
    : copy.submitLabel;
  const resultVisible = solved || config.resultVisibility === 'live' || config.resultVisibility === 'initial';
  const guide = solved || ('directionGuideVisibility' in config);
  const planes = config.mode === 'two-directions' ? config.candidates.map(candidate => ({ id: candidate.id, source: candidate.vector, caption: copy['candidate' + candidate.id.toUpperCase()], visible: solved && config.requiredIds.some(v => v === candidate.id) }))
    : config.mode === 'exit-ticket' ? (solved ? config.questions.map(q => ({ id: q.id, source: q.vector, caption: undefined, visible: true })) : [])
    : [{ id: step.id, source: config.mode === 'hunt-direction' ? answer.vector : config.vector, caption: undefined, visible: resultVisible }];
  // Use the current authored question for phase-specific assistive instructions, too.
  const phaseCopy = phaseNames.length > 1 ? { ...copy, a11yChoices: question } : copy;
  const matrix = <div className="math-term math-matrix"><span className="math-label"><AuthoredText text={copy.matrixLabel} /></span><div className="matrix" role="group" aria-label={copy.matrixLabel}>{config.matrix.flat().map((n, i) => <span key={i}>{n}</span>)}</div></div>;
  const vectorTerm = (label: string, vector: Vector, result = false) => <div className="math-term" data-kind={result ? 1 : 0} data-testid={result ? 'mission-result' : undefined}>
    <span className="math-label"><i /><AuthoredText text={label} /></span><output><AuthoredText text={`(${vector.join(', ')})`} /></output>
  </div>;
  const vectorFields = <div className="mission-vector-fields">
    {config.mode === 'hunt-direction' ? ([0, 1] as const).map(axis => <label className="mission-number" key={axis}><span className="sr-only">{axis === 0 ? copy.xCoordinateLabel : copy.yCoordinateLabel}</span><input type="text" inputMode="decimal" autoComplete="off" title={axis === 0 ? copy.xCoordinateLabel : copy.yCoordinateLabel} value={vectorDraft[axis]} onChange={event => {
      const raw = event.target.value; const n = parseDecimal(raw);
      if (n !== null && Number.isInteger(n) && n >= -3 && n <= 3) {
        const vector: Vector = [...answer.vector]; vector[axis] = n; update({ vector });
      } else update({});
      setVectorDraft(previous => previous.map((value, index) => index === axis ? raw : value));
    }} onBlur={() => {
      const n = parseDecimal(vectorDraft[axis]);
      const vector: Vector = [...answer.vector]; vector[axis] = n === null ? answer.vector[axis] : Math.max(-3, Math.min(3, Math.round(n)));
      update({ vector });
    }} /></label>) : <>{numberInput(0, config.mode === 'exit-ticket' ? copy.partAFirstInputLabel : copy.firstInputLabel)}{numberInput(1, config.mode === 'exit-ticket' ? copy.partASecondInputLabel : copy.secondInputLabel)}</>}
  </div>;
  function equation() {
    if (config.mode === 'two-directions') return matrix;
    if (config.mode === 'exit-ticket' && phase > 0) return <>{matrix}{phase === 1 && <p className="mission-confirmed"><AuthoredText text={copy.outputConfirmedText} /></p>}</>;
    const source = config.mode === 'hunt-direction' ? answer.vector : config.mode === 'exit-ticket' ? config.questions[0].vector : config.vector;
    const enteringOutput = config.mode === 'calculate-output' || config.mode === 'exit-ticket';
    return <>{matrix}<span className="math-operator" aria-hidden="true">{'×'}</span>
      {config.mode === 'hunt-direction' ? <div className="math-term" data-kind={0}><span className="math-label"><i /><AuthoredText text={copy.inputLabel} /></span>{vectorFields}</div> : vectorTerm(copy.inputLabel, source)}
      <span className="math-operator" aria-hidden="true">{'='}</span>
      {enteringOutput ? <div className="math-term" data-kind={1} data-testid={solved ? 'mission-result' : undefined}><span className="math-label"><i /><AuthoredText text={copy.outputLabel} /></span>{vectorFields}</div>
        : resultVisible ? vectorTerm(copy.outputLabel, transform(config.matrix, source), true)
        : <div className="math-term" data-kind={1}><span className="math-label"><i /><AuthoredText text={copy.outputLabel} /></span><span className="math-unknown" aria-hidden="true">{'?'}</span></div>}
    </>;
  }
  function candidateMultiplier(candidate: string): ReactNode {
    return <label className="mission-number mission-candidate-scalar"><span id={`${id}-${candidate}-scale`}><AuthoredText text={copy.multiplierLabel} /></span><input type="text" inputMode="decimal" autoComplete="off" disabled={phaseCorrect} aria-label={copy['candidate' + candidate.toUpperCase()] + ' ' + copy.multiplierLabel} value={answer.scales[candidate] ?? ''} onChange={event => update({ scales: { ...answer.scales, [candidate]: event.target.value } })} /></label>;
  }
  return <section className="eigen-mission" data-mission={config.mode} data-phase={phaseNames[phase]} data-attempt-count={attemptCount} data-phase-attempt-count={current.attemptCount} data-hint-used={hintUsed} data-solved={solved}>
    <div className="mission-progress" role="progressbar" aria-label={copy.progressLabel} aria-valuenow={stage} aria-valuemin={1} aria-valuemax={7} aria-valuetext={copy.progressLabel}>
      <span><AuthoredText text={copy.progressLabel} /></span><div aria-hidden="true">{missionModes.map((mode, i) => <i key={mode} data-current={i + 1 === stage} data-reached={i + 1 <= stage} />)}</div>
    </div>
    <form onSubmit={submit} noValidate className="mission-workbench" data-mode={config.mode} data-multiple={planes.length > 1} data-diagram-free={planes.length === 0} aria-describedby={`${id}-instructions`}>
      <p id={`${id}-instructions`} className="sr-only"><AuthoredText text={phaseCopy.a11yChoices} /></p>
      <fieldset disabled={phaseCorrect} className="mission-answer">
        <legend ref={questionRef} tabIndex={-1}><AuthoredText text={question} /></legend>
        <div className="mission-equation">{equation()}</div>
        <div className="mission-controls">
          {(config.mode === 'predict-output' || config.mode === 'classify-line') && <div className="mission-choices" data-prediction={config.mode === 'predict-output'}>
            {(config.mode === 'predict-output' ? config.choices : config.options).map(option => <label className="mission-choice" key={option.id} data-selected={answer.choice === option.id}>
              <input type="radio" name={id} checked={answer.choice === option.id} onChange={() => update({ choice: option.id })} /><span><AuthoredText text={copy['choice' + option.id.toUpperCase()]} /></span>
            </label>)}
          </div>}
          {config.mode === 'classify-and-scale' && (phase === 0 ? booleanChoices(copy.choiceYes, copy.choiceNo) : numberInput(0, copy.scaleInputLabel))}
          {config.mode === 'two-directions' && phase === 0 && <p className="mission-select-label"><AuthoredText text={copy.selectLabel} /></p>}
          {config.mode === 'exit-ticket' && (phase === 1 ? numberInput(2, copy.partAScaleInputLabel) : phase === 2 ? booleanChoices(copy.partBYes, copy.partBNo) : null)}
        </div>
      </fieldset>
      {planes.length > 0 && <div className="mission-plots">{planes.map(plane => <div className="mission-plot-option" key={plane.id} data-selectable={config.mode === 'two-directions' && phase === 0} data-selected={config.mode === 'two-directions' && answer.selected.includes(plane.id)}>
        {config.mode === 'two-directions' && phase === 0 && <><input id={`${id}-${plane.id}-choice`} type="checkbox" disabled={phaseCorrect} aria-label={plane.caption} checked={answer.selected.includes(plane.id)} onChange={event => update({ selected: event.target.checked ? [...answer.selected, plane.id] : answer.selected.filter(value => value !== plane.id) })} /><label className="mission-plot-hit" htmlFor={`${id}-${plane.id}-choice`} aria-hidden="true" /></>}
        <MissionPlane source={plane.source} result={transform(config.matrix, plane.source)} visible={plane.visible} guide={guide} display={config.display} copy={phaseCopy} caption={plane.caption}
          drag={config.mode === 'hunt-direction' ? vector => update({ vector }) : undefined} locked={solved} revealOnMount={config.mode === 'exit-ticket'} showReadouts={planes.length > 1 && (config.mode !== 'two-directions' || plane.visible)}>
          {config.mode === 'two-directions' && phase === 1 && config.requiredIds.some(value => value === plane.id) && candidateMultiplier(plane.id)}
        </MissionPlane>
      </div>)}</div>}
      <div className="mission-response">
        {!phaseCorrect && <div className="mission-actions"><button type="submit" disabled={invalidDraft || ((config.mode === 'predict-output' || config.mode === 'classify-line') && !answer.choice)}><AuthoredText text={submitLabel} /></button>
          {!current.hintUsed && current.attemptCount >= ('offerHintAfterAttempts' in config ? config.offerHintAfterAttempts : 0) && <button type="button" className="mission-hint-button" onClick={() => recordPhase({ hintUsed: true })}><AuthoredText text={copy.hintLabel} /></button>}
        </div>}
        {current.hintUsed && !phaseCorrect && <aside className="mission-hint"><AuthoredText text={copy.hintText} /></aside>}
        <div ref={feedbackRef} className="mission-feedback" data-correct={phaseCorrect} data-visible={Boolean(outcome)}>
          <p role="status" data-testid="mission-feedback">{outcome && <AuthoredText text={copy[outcome.key]} />}</p>
          {outcome && !phaseCorrect && <button type="button" className="mission-retry" onClick={() => setOutcome(undefined)}><AuthoredText text={copy.retryLabel} /></button>}
          {phaseCorrect && !solved && <button type="button" onClick={() => { setOutcome(undefined); setPhase(value => value + 1); }}><AuthoredText text={copy.phaseContinueLabel} /></button>}
          {solved && <><p className="mission-explanation"><AuthoredText text={copy.revealExplanation} /></p><p className="sr-only"><AuthoredText text={copy.a11yReveal} /></p><button type="button" onClick={() => navigate(step.actions[0].target)}>{step.actions[0].label}</button></>}
        </div>
      </div>
    </form>
  </section>;
}
