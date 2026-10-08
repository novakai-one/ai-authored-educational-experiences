import { useEffect, useRef, useState } from 'react';
import type { Vector, VectorStep } from '../spec/schema';

function useAnimatedVector(target: Vector, animation: VectorStep['visual']['animation']) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const start = performance.now();
    const from = current.current;
    const update = (next: Vector) => { current.current = next; setValue(next); };
    const finish = () => { cancelAnimationFrame(frame); update(target); };
    const tick = (now: number) => {
      const t = Math.min((now - start) / animation.durationMs, 1);
      const eased = animation.easing === 'linear' ? t : t * t * (3 - 2 * t);
      update([from[0] + (target[0] - from[0]) * eased, from[1] + (target[1] - from[1]) * eased]);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    if (media.matches || animation.durationMs === 0) finish();
    else frame = requestAnimationFrame(tick);
    media.addEventListener('change', finish);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', finish); };
  }, [target[0], target[1], animation.durationMs, animation.easing]);
  return value;
}

export function VectorPlane({ step, source, result }: { step: VectorStep; source: Vector; result: Vector }) {
  const v = step.visual;
  const animated = useAnimatedVector(result, v.animation);
  const { min, max, tick } = v.domain;
  const size = 460;
  const project = (n: number) => 38 + ((n - min) / (max - min)) * size;
  const px = project;
  const py = (n: number) => 536 - project(n);
  const ticks = Array.from({ length: Math.round((max - min) / tick) + 1 }, (_, i) => min + i * tick);
  return <figure className="plane-card">
    <figcaption>{v.title}</figcaption>
    <svg viewBox="0 0 536 536" role="img" aria-labelledby={`${step.id}-plane-title ${step.id}-plane-desc`}>
      <title id={`${step.id}-plane-title`}>{v.title}</title>
      <desc id={`${step.id}-plane-desc`}>{v.description}</desc>
      <defs>
        <marker id={`${step.id}-source-tip`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7 Z" fill={v.sourceColor} /></marker>
        <marker id={`${step.id}-result-tip`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7 Z" fill={v.resultColor} /></marker>
      </defs>
      {ticks.map(n => <g key={n} className="grid">
        <line x1={px(n)} x2={px(n)} y1={py(min)} y2={py(max)} />
        <line x1={px(min)} x2={px(max)} y1={py(n)} y2={py(n)} />
        <text x={px(n)} y={py(0) + 18}>{Number(n.toPrecision(6))}</text>
        {n !== 0 && <text x={px(0) - 16} y={py(n) + 4}>{Number(n.toPrecision(6))}</text>}
      </g>)}
      <g className="axes"><line x1={px(min)} x2={px(max)} y1={py(0)} y2={py(0)} /><line x1={px(0)} x2={px(0)} y1={py(min)} y2={py(max)} /></g>
      <text className="axis-label" x={px(max) + 15} y={py(0) + 4}>{v.xAxisLabel}</text>
      <text className="axis-label" x={px(0)} y={py(max) - 18}>{v.yAxisLabel}</text>
      <line data-testid="source-vector" x1={px(0)} y1={py(0)} x2={px(source[0])} y2={py(source[1])} stroke={v.sourceColor} strokeWidth="3" markerEnd={`url(#${step.id}-source-tip)`} />
      <line data-testid="result-vector" x1={px(0)} y1={py(0)} x2={px(animated[0])} y2={py(animated[1])} stroke={v.resultColor} strokeWidth="3" strokeDasharray="7 5" markerEnd={`url(#${step.id}-result-tip)`} />
    </svg>
    <div className="legend">
      <div><span className="swatch" style={{ borderColor: v.sourceColor }} /><span>{v.sourceLabel}</span><output data-testid="source-coordinates">{`(${source.join(', ')})`}</output></div>
      <div><span className="swatch dashed" style={{ borderColor: v.resultColor }} /><span>{v.resultLabel}</span><output data-testid="result-coordinates">{`(${result.join(', ')})`}</output></div>
    </div>
    <p className="visual-description">{v.description}</p>
  </figure>;
}
