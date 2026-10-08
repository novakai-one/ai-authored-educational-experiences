import { useEffect, useId, useState, type FormEvent } from 'react';
import type { CustomStep } from '../spec/extensions';
import { missionModes, type MissionConfig } from '../spec/eigenMission';
import { evaluateMission, initialAnswer, binaryAnswerValues, type MissionAnswer, type MissionAssessment } from '../engine/eigen';
import { transform } from '../engine/math';
import type { Vector } from '../spec/schema';
import { MissionPlane } from './MissionPlane';

export function EigenMission({ step, navigate, recordAssessment }: {
  step: CustomStep; navigate: (target: string) => void; recordAssessment?: (assessment: MissionAssessment) => void;
}) {
  const config = step.config as MissionConfig;
  const copy = step.copy;
  const id = useId();
  const [answer, setAnswer] = useState(() => initialAnswer(config));
  const [outcome, setOutcome] = useState<ReturnType<typeof evaluateMission>>();
  const [attemptCount, setAttemptCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const solved = outcome?.correct === true;
  const stage = missionModes.indexOf(config.mode) + 1;
  useEffect(() => { recordAssessment?.({ attemptCount, hintUsed, isCorrect: solved }); }, [attemptCount, hintUsed, solved]);
  function update(patch: Partial<MissionAnswer>) {
    if (solved) return;
    setAnswer(previous => ({ ...previous, ...patch })); setOutcome(undefined);
  }
  function numberInput(index: number, label: string) {
    return <label className="mission-number"><span>{label}</span><input type="text" inputMode="decimal" autoComplete="off" value={answer.numbers[index]} onChange={event => {
      const numbers = [...answer.numbers]; numbers[index] = event.target.value; update({ numbers });
    }} /></label>;
  }
  function booleanChoices(yes: string, no: string) {
    return <div className="mission-choices">
      {binaryAnswerValues.map((value, i) => <label className="mission-choice" key={value} data-selected={answer.choice === value}>
        <input type="radio" name={id} checked={answer.choice === value} onChange={() => update({ choice: value })} /><span>{i === 0 ? yes : no}</span>
      </label>)}
    </div>;
  }
  function submit(event: FormEvent) {
    event.preventDefault(); if (solved) return;
    if ((config.mode === 'predict-output' || config.mode === 'classify-line') && !answer.choice) return;
    setAttemptCount(n => n + 1); setOutcome(evaluateMission(config, answer));
  }
  const resultVisible = solved || config.resultVisibility === 'live' || config.resultVisibility === 'initial';
  const guide = solved || ('directionGuideVisibility' in config);
  const planes = config.mode === 'two-directions' ? config.candidates.map(candidate => ({ id: candidate.id, source: candidate.vector, caption: copy['candidate' + candidate.id.toUpperCase()], visible: solved && config.requiredIds.some(v => v === candidate.id) }))
    : config.mode === 'exit-ticket' ? (solved ? config.questions.map(q => ({ id: q.id, source: q.vector, caption: undefined, visible: true })) : [])
    : [{ id: step.id, source: config.mode === 'hunt-direction' ? answer.vector : config.vector, caption: undefined, visible: resultVisible }];
  return <section className="eigen-mission" data-mission={config.mode} data-attempt-count={attemptCount} data-hint-used={hintUsed} data-solved={solved}>
    <div className="mission-progress" role="progressbar" aria-label={copy.progressLabel} aria-valuenow={stage} aria-valuemin={1} aria-valuemax={7} aria-valuetext={copy.progressLabel}>
      <span>{copy.progressLabel}</span><div aria-hidden="true">{missionModes.map((mode, i) => <i key={mode} data-current={i + 1 === stage} data-reached={i + 1 <= stage}>{i + 1}</i>)}</div>
    </div>
    <div className="mission-workbench" data-multiple={planes.length > 1} data-diagram-free={planes.length === 0}>
      {planes.length > 0 && <div className="mission-plots">{planes.map(plane => <MissionPlane key={plane.id} source={plane.source} result={transform(config.matrix, plane.source)} visible={plane.visible} guide={guide} display={config.display} copy={copy} caption={plane.caption}
        drag={config.mode === 'hunt-direction' ? vector => update({ vector }) : undefined} locked={solved} revealOnMount={config.mode === 'exit-ticket'} />)}</div>}
      <div className="mission-console">
        <div className="mission-matrix"><h3>{copy.matrixLabel}</h3><div className="matrix" role="group" aria-label={copy.matrixLabel}>{config.matrix.flat().map((n, i) => <span key={i}>{n}</span>)}</div></div>
        <form onSubmit={submit} noValidate aria-describedby={`${id}-instructions`}>
          <p id={`${id}-instructions`} className="sr-only">{copy.a11yChoices}</p>
          <fieldset disabled={solved} className="mission-answer">
            {(config.mode === 'predict-output' || config.mode === 'classify-line') && <>
              <legend>{copy.question}</legend><div className="mission-choices">
                {(config.mode === 'predict-output' ? config.choices : config.options).map(option => <label className="mission-choice" key={option.id} data-selected={answer.choice === option.id}>
                  <input type="radio" name={id} checked={answer.choice === option.id} onChange={() => update({ choice: option.id })} /><span>{copy['choice' + option.id.toUpperCase()]}</span>
                </label>)}
              </div>
            </>}
            {config.mode === 'hunt-direction' && <>
              <legend>{copy.question}</legend><div className="mission-number-row">
                {([0, 1] as const).map(axis => <label className="mission-number" key={axis}><span>{axis === 0 ? copy.xCoordinateLabel : copy.yCoordinateLabel}</span><input type="number" min={-3} max={3} step={1} value={answer.vector[axis]} onChange={event => {
                  const n = Number(event.target.value); if (!event.target.value || !Number.isFinite(n)) return;
                  const vector: Vector = [...answer.vector]; vector[axis] = Math.max(-3, Math.min(3, Math.round(n))); update({ vector });
                }} /></label>)}
              </div>
            </>}
            {config.mode === 'calculate-output' && <><legend>{copy.question}</legend><div className="mission-number-row">{numberInput(0, copy.firstInputLabel)}{numberInput(1, copy.secondInputLabel)}</div></>}
            {config.mode === 'classify-and-scale' && <>
              <legend>{copy.lineQuestion}</legend>{booleanChoices(copy.choiceYes, copy.choiceNo)}
              <p className="mission-question">{copy.scaleQuestion}</p>{numberInput(0, copy.scaleInputLabel)}
            </>}
            {config.mode === 'two-directions' && <>
              <legend>{copy.question}</legend><fieldset className="mission-candidates"><legend>{copy.selectLabel}</legend>
                {config.candidates.map(candidate => <div className="mission-candidate" key={candidate.id}>
                  <label className="mission-choice" data-selected={answer.selected.includes(candidate.id)}>
                    <input type="checkbox" checked={answer.selected.includes(candidate.id)} onChange={event => update({ selected: event.target.checked ? [...answer.selected, candidate.id] : answer.selected.filter(v => v !== candidate.id) })} /><span id={`${id}-${candidate.id}`}>{copy['candidate' + candidate.id.toUpperCase()]}</span>
                  </label>
                  {answer.selected.includes(candidate.id) && <label className="mission-number"><span id={`${id}-${candidate.id}-scale`}>{copy.multiplierLabel}</span><input type="text" inputMode="decimal" autoComplete="off" aria-labelledby={`${id}-${candidate.id} ${id}-${candidate.id}-scale`} value={answer.scales[candidate.id] ?? ''} onChange={event => update({ scales: { ...answer.scales, [candidate.id]: event.target.value } })} /></label>}
                </div>)}
              </fieldset>
            </>}
            {config.mode === 'exit-ticket' && <>
              <legend>{copy.partAQuestion}</legend><div className="mission-number-row">{numberInput(0, copy.partAFirstInputLabel)}{numberInput(1, copy.partASecondInputLabel)}</div>
              <p className="mission-question">{copy.partAScaleQuestion}</p>{numberInput(2, copy.partAScaleInputLabel)}
              <fieldset className="mission-final-decision"><legend>{copy.partBQuestion}</legend>{booleanChoices(copy.partBYes, copy.partBNo)}</fieldset>
            </>}
          </fieldset>
          {!solved && <div className="mission-actions"><button type="submit" disabled={(config.mode === 'predict-output' || config.mode === 'classify-line') && !answer.choice}>{copy.submitLabel}</button>
            {!hintUsed && attemptCount >= ('offerHintAfterAttempts' in config ? config.offerHintAfterAttempts : 0) && <button type="button" className="mission-hint-button" onClick={() => setHintUsed(true)}>{copy.hintLabel}</button>}
          </div>}
        </form>
        {hintUsed && <aside className="mission-hint">{copy.hintText}</aside>}
        <div className="mission-feedback" data-correct={solved} data-visible={Boolean(outcome)}>
          <p role="status" data-testid="mission-feedback">{outcome && copy[outcome.key]}</p>
          {outcome && !solved && <button type="button" className="mission-retry" onClick={() => setOutcome(undefined)}>{copy.retryLabel}</button>}
          {solved && <><p className="mission-explanation">{copy.revealExplanation}</p><p className="sr-only">{copy.a11yReveal}</p><button type="button" onClick={() => navigate(step.actions[0].target)}>{step.actions[0].label}</button></>}
        </div>
      </div>
    </div>
  </section>;
}
