import type { ReactNode } from 'react';

// Chris requested column notation on 2026-10-08. Preserve every original text
// character and accessible label; change only the visual arrangement of pairs.
// Matrix row arrays and arithmetic prose are deliberately not reinterpreted.
export function AuthoredText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern = /(\(\s*)([+−-]?\d+(?:\.\d+)?)(,\s*)([+−-]?\d+(?:\.\d+)?)(\s*\))|A\s+v\s*=\s*λ\s+v/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    parts.push(text.slice(cursor, match.index));
    if (!match[1]) {
      parts.push(<span className="symbolic-equation" key={match.index}>{match[0]}</span>);
      cursor = match.index + match[0].length;
      continue;
    }
    parts.push(<span className="column-vector" key={match.index} role="math" aria-label={match[0]}>
      <span className="sr-only" aria-hidden="true">{match[1]}</span><span className="vector-component" aria-hidden="true">{match[2]}</span>
      <span className="sr-only" aria-hidden="true">{match[3]}</span><span className="vector-component" aria-hidden="true">{match[4]}</span><span className="sr-only" aria-hidden="true">{match[5]}</span>
    </span>);
    cursor = match.index + match[0].length;
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}
