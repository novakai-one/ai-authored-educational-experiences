import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authored, missions, enter, start, fill, check, solve, hiddenResult, continuePhase } from './eigen.helpers';

test('prediction and classification show each exact feedback branch, and gate hints/reveals/continuation', async ({ page }) => {
  await start(page); const s = missions[0];
  const vector = page.locator('.mission-equation output .column-vector').first();
  await expect(vector).toHaveAccessibleName('(2, 1)');
  await expect(vector.locator('.vector-component')).toHaveText(['2', '1']);
  const positions = await vector.locator('.vector-component').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y, bottom: r.bottom }; }));
  expect(positions[1].y).toBeGreaterThanOrEqual(positions[0].bottom);
  expect(positions[1].x).toBeCloseTo(positions[0].x);
  await hiddenResult(page, s);
  await expect(page.getByRole('button', { name: s.copy.submitLabel })).toBeDisabled();
  await expect(page.getByRole('button', { name: s.copy.hintLabel })).toHaveCount(0);
  for (const id of ['B', 'C', 'D']) {
    await page.getByLabel(s.copy['choice' + id], { exact: true }).check(); await check(page, s, 'feedback' + id);
    await hiddenResult(page, s);
    await expect(page.getByRole('button', { name: s.actions[0].label })).toHaveCount(0);
  }
  await page.getByRole('button', { name: s.copy.hintLabel }).click();
  await expect(page.getByText(s.copy.hintText, { exact: true })).toBeVisible(); await hiddenResult(page, s);
  await solve(page, s);
  await expect(page.getByLabel(s.copy.choiceB, { exact: true })).toBeDisabled();
  await expect(page.getByTestId('mission-result')).toContainText('(4, 1)');
  await page.getByRole('button', { name: s.actions[0].label }).click();
  const line = missions[1];
  for (const id of ['A', 'C']) { await page.getByLabel(line.copy['choice' + id], { exact: true }).check(); await check(page, line, 'feedback' + id); }
  const guide = page.getByTestId('direction-guide');
  expect(Number(await guide.getAttribute('x1')) + Number(await guide.getAttribute('x2'))).toBe(476);
  expect(Number(await guide.getAttribute('y1')) + Number(await guide.getAttribute('y2'))).toBe(476);
  await solve(page, line);
});

test('hunt supports keyboard, snapped pointer drag and grid fields; only a committed nonzero direction succeeds', async ({ page }) => {
  await enter(page, 2); const s = missions[2];
  await check(page, s, 'feedbackTurned');
  await fill(page, s.copy.xCoordinateLabel, '0'); await fill(page, s.copy.yCoordinateLabel, '0'); await check(page, s, 'feedbackZero');
  const handle = page.getByRole('button', { name: s.copy.dragLabel });
  await handle.focus(); await handle.press('ArrowRight');
  await expect(page.getByLabel(s.copy.xCoordinateLabel)).toHaveValue('1');
  await expect(page.getByRole('button', { name: s.actions[0].label })).toHaveCount(0);
  const svg = page.locator('.mission-plane svg');
  const box = await svg.boundingBox(); const tip = await handle.boundingBox();
  const scale = Math.min(box!.width, box!.height) / 476;
  await page.mouse.move(tip!.x + tip!.width / 2, tip!.y + tip!.height / 2); await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 - 60 * scale, box!.y + box!.height / 2 + 0.2 * scale, { steps: 8 }); await page.mouse.up();
  await expect(page.getByLabel(s.copy.xCoordinateLabel)).toHaveValue('-2');
  await expect(page.getByLabel(s.copy.yCoordinateLabel)).toHaveValue('0');
  await expect(page.getByRole('button', { name: s.actions[0].label })).toHaveCount(0);
  await check(page, s, 'feedbackCorrect');
  await expect(page.getByLabel(s.copy.xCoordinateLabel)).toBeDisabled();
  await handle.press('ArrowUp'); await expect(page.getByLabel(s.copy.yCoordinateLabel)).toHaveValue('0');
});

test('calculation exposes every authored numeric outcome and never leaks a premature result description', async ({ page }) => {
  await enter(page, 3); const s = missions[3]; await hiddenResult(page, s);
  for (const [x, y, key] of [['', '', 'feedbackInvalid'], ['1e0', '1', 'feedbackInvalid'], ['3', '9', 'feedbackXOnly'], ['9', '1', 'feedbackYOnly'], ['0', '0', 'feedbackNeither']]) {
    await fill(page, s.copy.firstInputLabel, x); await fill(page, s.copy.secondInputLabel, y); await check(page, s, key); await hiddenResult(page, s);
  }
  await solve(page, s); await expect(page.getByTestId('mission-result').getByRole('textbox').first()).toHaveValue('3'); await expect(page.getByTestId('mission-result').getByRole('textbox').last()).toHaveValue('1');
});

test('negative eigenvalue asks about the line, locks success, then asks for the multiplier', async ({ page }) => {
  await enter(page, 4); const s = missions[4];
  await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(await page.locator('body').textContent()).not.toContain(s.copy.scaleQuestion);
  await check(page, s, 'feedbackInvalid');
  await page.getByLabel(s.copy.choiceNo, { exact: true }).check(); await check(page, s, 'feedbackWrongLine');
  await page.getByLabel(s.copy.choiceYes, { exact: true }).check(); await check(page, s, 'lineCorrectText');
  await expect(page.getByLabel(s.copy.choiceYes, { exact: true })).toBeDisabled();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: s.actions[0].label, exact: true })).toHaveCount(0);
  await continuePhase(page, s);
  await expect(page.getByRole('radio')).toHaveCount(0);
  await check(page, s, 'feedbackInvalidMultiplier');
  await fill(page, s.copy.scaleInputLabel, '2'); await check(page, s, 'feedbackPositiveScale');
  await fill(page, s.copy.scaleInputLabel, '0'); await check(page, s, 'feedbackWrongScale');
  await solve(page, s); await expect(page.getByTestId('mission-result')).toContainText('(-2, 0)');
});

test('two directions commits the selection before rendering exactly two multiplier fields', async ({ page }) => {
  await enter(page, 5); const s = missions[5]; const c = s.copy;
  await hiddenResult(page, s); await check(page, s, 'feedbackInvalid');
  await expect(page.getByRole('button', { name: c.hintLabel })).toBeVisible();
  for (const id of ['C', 'D']) await page.getByRole('checkbox', { name: c['candidate' + id], exact: true }).check();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(await page.locator('body').textContent()).not.toContain(c.multiplierQuestion);
  await check(page, s, 'feedbackContainsC'); await hiddenResult(page, s);
  await page.getByRole('checkbox', { name: c.candidateC, exact: true }).uncheck(); await page.getByRole('checkbox', { name: c.candidateA, exact: true }).check();
  await check(page, s, 'feedbackContainsD');
  await page.getByRole('checkbox', { name: c.candidateD, exact: true }).uncheck(); await page.getByRole('checkbox', { name: c.candidateB, exact: true }).check();
  await check(page, s, 'directionCorrectText'); await hiddenResult(page, s);
  await expect(page.getByRole('checkbox').first()).toBeDisabled();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await continuePhase(page, s);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await check(page, s, 'feedbackInvalidMultipliers');
  await fill(page, c.candidateA + ' ' + c.multiplierLabel, '2'); await fill(page, c.candidateB + ' ' + c.multiplierLabel, '2');
  await check(page, s, 'feedbackWrongScaleA'); await hiddenResult(page, s);
  await fill(page, c.candidateA + ' ' + c.multiplierLabel, '3'); await check(page, s, 'feedbackWrongScaleB');
  await fill(page, c.candidateB + ' ' + c.multiplierLabel, '1'); await check(page, s, 'feedbackCorrect');
  await expect(page.getByTestId('mission-result')).toHaveCount(2);
});

test('exit ticket withholds future questions and diagrams, records each phase, and resets on restart', async ({ page }) => {
  await enter(page, 6); const s = missions[6]; const c = s.copy;
  await expect(page.locator('.mission-plane')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByRole('radio')).toHaveCount(0);
  for (const future of [c.partAScaleQuestion, c.partBQuestion, c.outputConfirmedText]) expect(await page.locator('body').textContent()).not.toContain(future);
  await page.getByRole('button', { name: c.hintLabel }).click();
  await check(page, s, 'feedbackInvalid');
  await fill(page, c.partAFirstInputLabel, '5'); await fill(page, c.partASecondInputLabel, '1');
  await check(page, s, 'feedbackWrongOutput'); await hiddenResult(page, s);
  await fill(page, c.partAFirstInputLabel, '6'); await fill(page, c.partASecondInputLabel, '0'); await check(page, s, 'outputCorrectText');
  await expect(page.getByRole('textbox').first()).toBeDisabled();
  expect(await page.locator('body').textContent()).not.toContain(c.partAScaleQuestion);
  await expect(page.locator('.mission-plane')).toHaveCount(0);
  await continuePhase(page, s);
  await expect(page.locator('.mission-hint')).toHaveCount(0);
  expect(await page.locator('.mission-confirmed').textContent()).toBe(c.outputConfirmedText);
  await expect(page.getByRole('textbox')).toHaveCount(1);
  expect(await page.locator('body').textContent()).not.toContain(c.partBQuestion);
  await fill(page, c.partAScaleInputLabel, '2'); await check(page, s, 'feedbackWrongScale'); await hiddenResult(page, s);
  await fill(page, c.partAScaleInputLabel, '3'); await check(page, s, 'scaleCorrectText');
  await expect(page.getByRole('radio')).toHaveCount(0);
  await continuePhase(page, s);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.locator('.mission-plane')).toHaveCount(0);
  await page.getByLabel(c.partBYes, { exact: true }).check(); await check(page, s, 'feedbackWrongClassification');
  await hiddenResult(page, s);
  await solve(page, s); await expect(page.locator('.mission-plane')).toHaveCount(2);
  await page.getByRole('button', { name: s.actions[0].label }).click();
  expect(JSON.parse((await page.locator('.shell').getAttribute('data-assessments'))!)['exit-ticket']).toEqual({ attemptCount: 7, hintUsed: true, isCorrect: true, phases: {
    'calculate-output': { attemptCount: 3, hintUsed: true, isCorrect: true },
    'find-eigenvalue': { attemptCount: 2, hintUsed: false, isCorrect: true },
    'classify-vector': { attemptCount: 2, hintUsed: false, isCorrect: true },
  } });
  await expect(page.locator('h2')).toHaveText(authored.steps[8].title);
  await page.getByRole('button', { name: authored.steps[8].restart.label }).click();
  expect(JSON.parse((await page.locator('.shell').getAttribute('data-assessments'))!)).toEqual({});
  await page.getByRole('button', { name: authored.steps[0].action.label }).click();
  for (let i = 0; i < 6; i++) { await solve(page, missions[i]); await page.getByRole('button', { name: missions[i].actions[0].label, exact: true }).click(); }
  await expect(page.locator('.eigen-mission')).toHaveAttribute('data-phase', 'calculate-output');
  await expect(page.locator('.eigen-mission')).toHaveAttribute('data-attempt-count', '0');
  await expect(page.locator('.eigen-mission')).toHaveAttribute('data-hint-used', 'false');
  for (const input of await page.getByRole('textbox').all()) await expect(input).toHaveValue('');
});

test('all stages are accessible on mobile, honor reduced motion, and preserve authored copy', async ({ page }) => {
  // This full journey performs fourteen accessibility scans alongside the evidence captures.
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page);
  for (const s of missions) {
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', s.copy.progressLabel);
    for (let i = 0; i < s.body.length; i++) expect(await page.locator('[data-copy="steps.' + s.id + '.body.' + i + '"]').textContent()).toBe(s.body[i]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await solve(page, s);
    if (s.config.mode !== 'hunt-direction') for (const node of await page.locator('[data-vector="1"]').all()) {
      expect(Number.isFinite(Number(await node.getAttribute('data-x')))).toBe(true);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: s.actions[0].label, exact: true }).click();
  }
  expect(JSON.parse((await page.locator('.shell').getAttribute('data-assessments'))!)['exit-ticket']).toEqual({ attemptCount: 3, hintUsed: false, isCorrect: true, phases: Object.fromEntries(missions[6].config.answerSequence.map((name: string) => [name, { attemptCount: 1, hintUsed: false, isCorrect: true }])) });
});

test('650ms reveal starts before its final endpoint and ends exactly at the computed coordinates', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T08:00:00Z') });
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await start(page); const s = missions[0];
  await page.clock.pauseAt(new Date('2026-10-08T10:00:00Z'));
  await solve(page, s);
  const arrow = page.locator('[data-vector="1"]');
  await expect(arrow).toHaveAttribute('data-x', '2');
  await page.clock.runFor(320);
  expect(Number(await arrow.getAttribute('data-x'))).toBeGreaterThan(2);
  expect(Number(await arrow.getAttribute('data-x'))).toBeLessThan(4);
  await page.clock.runFor(320);
  expect(Number(await arrow.getAttribute('data-x'))).toBeLessThan(4);
  await page.clock.runFor(32);
  await expect(arrow).toHaveAttribute('data-x', '4');
  await expect(arrow).toHaveAttribute('data-y', '1');
  await page.clock.resume();
  await enter(page, 6);
  await page.clock.pauseAt(new Date('2026-10-08T12:00:00Z'));
  await solve(page, missions[6]);
  const finalArrow = page.locator('[data-vector="1"]').first();
  await expect(finalArrow).toHaveAttribute('data-x', '2');
  await page.clock.runFor(320);
  expect(Number(await finalArrow.getAttribute('data-x'))).toBeGreaterThan(2);
  expect(Number(await finalArrow.getAttribute('data-x'))).toBeLessThan(6);
  await page.clock.runFor(320);
  expect(Number(await finalArrow.getAttribute('data-x'))).toBeLessThan(6);
  await page.clock.runFor(32);
  await expect(finalArrow).toHaveAttribute('data-x', '6');
  await expect(finalArrow).toHaveAttribute('data-y', '0');
});

test('invalid mode copy, unsupported config and contradictory mathematics fail visibly', async ({ page }) => {
  for (const mutate of [(s: any) => { s.steps[1].copy.extraFeedback = 'Unexpected'; }, (s: any) => { s.steps[1].config.resultVisibility = 'initial'; }, (s: any) => { s.steps[1].config.correctId = 'd'; }]) {
    const spec = structuredClone(authored); mutate(spec);
    await page.route('**/experiences/eigenvector-alignment-lab.json', route => route.fulfill({ json: spec }));
    await page.goto('/?experience=eigenvector-alignment-lab');
    await expect(page.getByRole('heading', { name: 'Specification error' })).toBeVisible(); await expect(page.locator('.eigen-mission')).toHaveCount(0);
    await page.unroute('**/experiences/eigenvector-alignment-lab.json');
  }
});


test('compact vector entry supports natural signed typing, and selecting a diagram selects its candidate', async ({ page }) => {
  await enter(page, 2); const hunt = missions[2];
  const x = page.getByRole('textbox', { name: hunt.copy.xCoordinateLabel, exact: true });
  await x.click(); await x.press('ControlOrMeta+A'); await x.press('Backspace');
  await expect(x).toHaveValue('');
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  await x.pressSequentially('-2');
  await expect(x).toHaveValue('-2');
  await fill(page, hunt.copy.yCoordinateLabel, '0');
  await expect(page.locator('[data-vector="0"]')).toHaveAttribute('data-x', '-2');
  await check(page, hunt, 'feedbackCorrect');
  await page.getByRole('button', { name: hunt.actions[0].label, exact: true }).click();
  for (let i = 3; i < 5; i++) { await solve(page, missions[i]); await page.getByRole('button', { name: missions[i].actions[0].label, exact: true }).click(); }
  await page.locator('.mission-plot-hit').nth(0).click();
  await page.locator('.mission-plot-hit').nth(1).click();
  await expect(page.getByRole('checkbox', { name: missions[5].copy.candidateA, exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: missions[5].copy.candidateB, exact: true })).toBeChecked();
  await check(page, missions[5], 'directionCorrectText');
  await continuePhase(page, missions[5]);
  await expect(page.getByRole('textbox')).toHaveCount(2);
  for (const input of await page.getByRole('textbox').all()) expect((await input.boundingBox())!.width).toBeLessThanOrEqual(80);
});

test('the mathematical workspace fits narrow and intermediate viewports with stacked, number-sized fields', async ({ page }) => {
  await enter(page, 3);
  for (const width of [320, 390, 740, 800, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const boxes = await page.locator('.mission-vector-fields input').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { left: b.left, top: b.top, bottom: b.bottom, width: b.width }; }));
    expect(boxes).toHaveLength(2);
    expect(boxes[0].width).toBeLessThanOrEqual(80);
    expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom);
    expect(boxes[0].left).toBe(boxes[1].left);
  }
});
