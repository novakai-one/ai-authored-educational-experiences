import ts from 'typescript';

// This catches accidental copy creation; it is not a sandbox against a malicious
// maintainer. Author review and DOM fidelity evidence remain required.
const technicalAttributes = new Set([
  'className', 'id', 'key', 'type', 'inputMode', 'autoComplete', 'role',
  'aria-live', 'aria-hidden', 'tabIndex', 'viewBox', 'stroke', 'fill',
  'strokeWidth', 'strokeDasharray', 'd', 'markerWidth', 'markerHeight',
  'refX', 'refY', 'orient',
]);
export function checkCopy(source: string, file = 'component.tsx'): string[] {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const errors: string[] = [];
  function report(node: ts.Node, reason: string) {
    const { line } = ast.getLineAndCharacterOfPosition(node.getStart());
    errors.push(`${file}:${line + 1}: ${reason}`);
  }
  function visit(node: ts.Node) {
    if (ts.isJsxText(node) && node.text.trim()) report(node, 'literal learner-facing JSX text is forbidden');
    if (ts.isIdentifier(node) && node.text === 'dangerouslySetInnerHTML') report(node, 'raw HTML bypasses the copy boundary');
    if (ts.isStringLiteralLike(node) && /[A-Za-z]/.test(node.text)) {
      const parent = node.parent;
      const attr = ts.isJsxAttribute(parent) ? parent.name.getText(ast) : undefined;
      const allowed =
        (attr && (technicalAttributes.has(attr) || attr.startsWith('data-'))) ||
        ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) ||
        ts.isLiteralTypeNode(parent) || ts.isBinaryExpression(parent) ||
        ts.isCaseClause(parent) ||
        (ts.isCallExpression(parent) && parent.expression.getText(ast) === 'document.getElementById' && node.text === 'root') ||
        (ts.isCallExpression(parent) && /\.(addEventListener|removeEventListener)$/.test(parent.expression.getText(ast)) && node.text === 'change') ||
        (ts.isCallExpression(parent) && parent.expression.getText(ast) === 'matchMedia' && node.text === '(prefers-reduced-motion: reduce)') ||
        (ts.isNewExpression(parent) && parent.expression.getText(ast) === 'Error');
      if (!allowed) report(node, 'implementation string may contain unauthored copy; read text from the specification');
    }
    // Template literals may interpolate authored strings and computed numbers,
    // but may not inject words except into technical attributes/errors.
    if (ts.isTemplateExpression(node)) {
      const fragments = [node.head.text, ...node.templateSpans.map(s => s.literal.text)].join('');
      if (/[A-Za-z]/.test(fragments)) {
        const p = node.parent;
        let ancestor: ts.Node | undefined = p;
        while (ancestor && !ts.isJsxAttribute(ancestor) && !ts.isStatement(ancestor)) ancestor = ancestor.parent;
        const attr = ancestor && ts.isJsxAttribute(ancestor) ? ancestor.name.getText(ast) : '';
        const technical = attr && (technicalAttributes.has(attr) || attr.startsWith('data-') || ['aria-labelledby', 'aria-describedby', 'markerEnd', 'htmlFor'].includes(attr));
        const error = ts.isNewExpression(p) && p.expression.getText(ast) === 'Error';
        if (!technical && !error) report(node, 'template injects unauthored words');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return errors;
}
