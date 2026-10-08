import { useEffect, useId, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import type { Vector } from '../spec/schema';
import type { MissionConfig } from '../spec/eigenMission';
import { AuthoredText } from './AuthoredText';

function useResult(target: Vector, source: Vector, visible: boolean, duration: number, revealOnMount: boolean) {
  const [value, setValue] = useState(visible && !revealOnMount ? target : source);
  const current = useRef(value);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = (v: Vector) => { current.current = v; setValue(v); };
    const finish = () => { cancelAnimationFrame(frame); update(visible ? target : source); };
    const from = current.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      update([from[0] + (target[0] - from[0]) * t, from[1] + (target[1] - from[1]) * t]);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    if (!visible || media.matches) finish();
    else frame = requestAnimationFrame(tick);
    media.addEventListener('change', finish);
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', finish); };
  }, [target[0], target[1], source[0], source[1], visible, duration]);
  return value;
}

const project = (n: number) => 28 + (n + 7) * 30;
const vertical = (n: number) => 476 - project(n);
function Arrow({ vector, color, result }: { vector: Vector; color: string; result?: boolean }) {
  const x = project(vector[0]); const y = vertical(vector[1]);
  const dx = x - 238; const dy = y - 238; const length = Math.hypot(dx, dy);
  const ux = length ? dx / length : 0; const uy = length ? dy / length : 0;
  const head = Math.min(result ? 13 : 16, length);
  const width = Math.min(result ? 5 : 7, length / 2);
  const baseX = x - ux * head; const baseY = y - uy * head;
  return <g data-vector={result ? 1 : 0} data-x={vector[0]} data-y={vector[1]}>
    {length > 0 ? <>
      <line x1={238} y1={238} x2={baseX} y2={baseY} stroke={color} strokeWidth={result ? 3 : 4} strokeDasharray={result ? '7 5' : undefined} />
      <polygon points={`${x},${y} ${baseX - uy * width},${baseY + ux * width} ${baseX + uy * width},${baseY - ux * width}`} fill={color} />
    </> : <circle cx={238} cy={238} r={4} fill={color} />}
  </g>;
}

export function MissionPlane({ source, result, visible, guide, display, copy, drag, locked, caption, revealOnMount = false, showReadouts = true, children }: {
  source: Vector; result: Vector; visible: boolean; guide: boolean; display: MissionConfig['display'];
  copy: Record<string, string>; drag?: (v: Vector) => void; locked?: boolean; caption?: string; revealOnMount?: boolean; showReadouts?: boolean; children?: ReactNode;
}) {
  const id = useId();
  const animated = useResult(result, source, visible, display.animationMs, revealOnMount);
  const extent = Math.max(Math.abs(source[0]), Math.abs(source[1]));
  const guideEnd: Vector = extent ? [source[0] * 7 / extent, source[1] * 7 / extent] : [0, 0];
  const description = visible ? copy.graphDescription : copy.a11yChoices;
  function move(event: PointerEvent<SVGGElement>) {
    if (!drag || locked || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const svg = event.currentTarget.ownerSVGElement!;
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(svg.getScreenCTM()!.inverse());
    const snap = (n: number) => Math.max(-3, Math.min(3, Math.round(n)));
    drag([snap((local.x - 238) / 30), snap((238 - local.y) / 30)]);
  }
  return <figure className="mission-plane">
    <figcaption className={caption ? undefined : 'sr-only'}><AuthoredText text={caption ?? copy.graphLabel} /></figcaption>
    <svg viewBox="0 0 476 476" role={drag ? 'group' : 'img'} aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}>
      <title id={`${id}-title`}>{copy.graphLabel}</title><desc id={`${id}-desc`}>{description}</desc>
      <g className="mission-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, i) => i - 7).map(n => <g key={n}>
          <line x1={project(n)} x2={project(n)} y1={28} y2={448} />
          <line y1={vertical(n)} y2={vertical(n)} x1={28} x2={448} />
          {n % 2 === 0 && <><text x={project(n)} y={255}>{n}</text>{n !== 0 && <text x={225} y={vertical(n) + 4}>{n}</text>}</>}
        </g>)}
      </g>
      <g className="mission-axes" aria-hidden="true"><line x1={28} x2={448} y1={238} y2={238} /><line y1={28} y2={448} x1={238} x2={238} /></g>
      {guide && extent > 0 && <line className="mission-guide" data-testid="direction-guide" x1={project(-guideEnd[0])} y1={vertical(-guideEnd[1])} x2={project(guideEnd[0])} y2={vertical(guideEnd[1])} />}
      <Arrow vector={source} color={display.sourceColor} />
      {visible && <Arrow vector={animated} color={display.outputColor} result />}
      {drag && <g className="mission-drag" role="button" tabIndex={locked ? -1 : 0} aria-disabled={locked} aria-label={copy.dragLabel} aria-describedby={`${id}-desc`}
        onPointerDown={event => { if (!locked) { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus(); } }}
        onPointerMove={move} onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onKeyDown={event => {
          if (locked) return;
          const next: Vector = [...source];
          if (event.key === 'ArrowLeft') next[0]--;
          else if (event.key === 'ArrowRight') next[0]++;
          else if (event.key === 'ArrowUp') next[1]++;
          else if (event.key === 'ArrowDown') next[1]--;
          else return;
          event.preventDefault(); drag(next.map(n => Math.max(-3, Math.min(3, n))) as Vector);
        }}>
        <circle cx={project(source[0])} cy={vertical(source[1])} r={23} className="drag-hit" />
        <circle cx={project(source[0])} cy={vertical(source[1])} r={6} fill={display.sourceColor} className="drag-tip" />
      </g>}
    </svg>
    {showReadouts && <div className="mission-readouts">
      <div><i className="mission-source-swatch" style={{ borderColor: display.sourceColor }} /><span>{copy.inputLabel}</span><output><AuthoredText text={`(${source.join(', ')})`} /></output></div>
      {visible && <div data-testid="mission-result"><i className="mission-result-swatch" style={{ borderColor: display.outputColor }} /><span>{copy.outputLabel}</span><output><AuthoredText text={`(${result.join(', ')})`} /></output></div>}
    </div>}
    {children}
  </figure>;
}
