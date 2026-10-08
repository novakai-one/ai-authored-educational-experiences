import { useEffect, useRef, useState } from 'react';
import type { Experience } from './spec/schema';
import { extensions } from './spec/extensions';
import { StatusBanner } from './diagnostics';
import { VectorActivity } from './components/VectorActivity';
import type { MissionAssessment } from './engine/eigen';
import { AuthoredText } from './components/AuthoredText';

export function App({ spec }: { spec: Experience }) {
  const [current, setCurrent] = useState(spec.start);
  const [visit, setVisit] = useState(0);
  const [assessments, setAssessments] = useState<Record<string, MissionAssessment>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const step = spec.steps.find(s => s.id === current)!;
  useEffect(() => { heading.current?.focus(); }, [current, visit]);
  function navigate(target: string) {
    if (!spec.steps.some(s => s.id === target)) throw new Error(`Unknown transition: ${target}`);
    setCurrent(target);
    if (target === spec.start) setAssessments({});
    setVisit(n => n + 1);
  }
  const Custom = step.kind === 'custom' ? extensions[step.component].Component : undefined;
  return <div className="shell" data-experience={spec.id} data-assessments={JSON.stringify(assessments)}>
    <header className="masthead">
      <div><StatusBanner status={spec.status} /><h1 data-copy="title">{spec.title}</h1></div>
    </header>
    {spec.id !== 'eigenvector-alignment-lab' && spec.notice && <aside className="notice" data-copy="notice">{spec.notice}</aside>}
    <main>
      <section className="step-heading">
        <h2 ref={heading} tabIndex={-1} data-copy={`steps.${step.id}.title`}>{step.title}</h2>
        {step.body.map((paragraph, i) => <p key={i} data-copy={`steps.${step.id}.body.${i}`}>{spec.id === 'eigenvector-alignment-lab' ? <AuthoredText text={paragraph} /> : paragraph}</p>)}
      </section>
      {step.kind === 'vector-transform' && <VectorActivity key={`${step.id}-${visit}`} step={step} navigate={navigate} />}
      {step.kind === 'message' && <button onClick={() => navigate(step.action.target)}>{step.action.label}</button>}
      {step.kind === 'completion' && step.restart && <button onClick={() => navigate(step.restart!.target)}>{step.restart.label}</button>}
      {step.kind === 'custom' && Custom && <Custom key={`${step.id}-${visit}`} step={step} recordAssessment={assessment => setAssessments(previous => ({ ...previous, [step.id]: assessment }))} navigate={target => {
        if (!step.actions.some(a => a.target === target)) throw new Error(`Undeclared custom transition: ${target}`);
        navigate(target);
      }} />}
    </main>
    {spec.id === 'eigenvector-alignment-lab' && spec.notice && <aside className="notice" data-copy="notice">{spec.notice}</aside>}
  </div>;
}
