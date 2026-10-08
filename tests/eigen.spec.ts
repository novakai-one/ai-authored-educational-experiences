import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authored, missions, enter, start, fill, check, solve, hiddenResult } from './eigen.helpers';

test('prediction and classification show each exact feedback branch, and gate hints/reveals/continuation', async ({ page }) => {
  await start(page); const s = missions[0];
  const vector = page.locator('.mission-plane output .column-vector');
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
  await solve(page, s); await expect(page.getByTestId('mission-result')).toContainText('(3, 1)');
});

test('negative eigenvalue requires both decisions and follows the authored error priority', async ({ page }) => {
  await enter(page, 4); const s = missions[4]; await check(page, s, 'feedbackInvalid');
  await page.getByLabel(s.copy.choiceNo, { exact: true }).check(); await fill(page, s.copy.scaleInputLabel, '2'); await check(page, s, 'feedbackWrongLine');
  await page.getByLabel(s.copy.choiceYes, { exact: true }).check(); await check(page, s, 'feedbackPositiveScale');
  await fill(page, s.copy.scaleInputLabel, '0'); await check(page, s, 'feedbackWrongScale');
  await solve(page, s); await expect(page.getByTestId('mission-result')).toContainText('(-2, 0)');
});

test('two directions requires exactly two different candidates and correctly associated scalars', async ({ page }) => {
  await enter(page, 5); const s = missions[5]; const c = s.copy;
  await hiddenResult(page, s); await check(page, s, 'feedbackInvalid');
  for (const id of ['C', 'D']) { await page.getByRole('checkbox', { name: c['candidate' + id], exact: true }).check(); await fill(page, c['candidate' + id] + ' ' + c.multiplierLabel, '1'); }
  await check(page, s, 'feedbackContainsC'); await hiddenResult(page, s);
  await page.getByRole('checkbox', { name: c.candidateC, exact: true }).uncheck(); await page.getByRole('checkbox', { name: c.candidateA, exact: true }).check(); await fill(page, c.candidateA + ' ' + c.multiplierLabel, '2');
  await check(page, s, 'feedbackContainsD');
  await page.getByRole('checkbox', { name: c.candidateD, exact: true }).uncheck(); await page.getByRole('checkbox', { name: c.candidateB, exact: true }).check(); await fill(page, c.candidateB + ' ' + c.multiplierLabel, '2');
  await check(page, s, 'feedbackWrongScaleA'); await fill(page, c.candidateA + ' ' + c.multiplierLabel, '3'); await check(page, s, 'feedbackWrongScaleB');
  await fill(page, c.candidateB + ' ' + c.multiplierLabel, '1'); await check(page, s, 'feedbackCorrect');
  await expect(page.getByTestId('mission-result')).toHaveCount(2);
});

test('exit ticket withholds every diagram and records coached attempts without invented mastery claims', async ({ page }) => {
  await enter(page, 6); const s = missions[6]; const c = s.copy;
  await expect(page.locator('.mission-plane')).toHaveCount(0); await check(page, s, 'feedbackInvalid');
  await page.getByRole('button', { name: c.hintLabel }).click();
  await fill(page, c.partAFirstInputLabel, '5'); await fill(page, c.partASecondInputLabel, '1'); await fill(page, c.partAScaleInputLabel, '2'); await page.getByLabel(c.partBYes, { exact: true }).check();
  await check(page, s, 'feedbackWrongOutput'); await expect(page.locator('.mission-plane')).toHaveCount(0);
  await fill(page, c.partAFirstInputLabel, '6'); await fill(page, c.partASecondInputLabel, '0'); await check(page, s, 'feedbackWrongScale');
  await fill(page, c.partAScaleInputLabel, '3'); await check(page, s, 'feedbackWrongClassification');
  await solve(page, s); await expect(page.locator('.mission-plane')).toHaveCount(2);
  await page.getByRole('button', { name: s.actions[0].label }).click();
  expect(JSON.parse((await page.locator('.shell').getAttribute('data-assessments'))!)['exit-ticket']).toEqual({ attemptCount: 5, hintUsed: true, isCorrect: true });
  await expect(page.locator('h2')).toHaveText(authored.steps[8].title);
  await page.getByRole('button', { name: authored.steps[8].restart.label }).click();
  expect(JSON.parse((await page.locator('.shell').getAttribute('data-assessments'))!)).toEqual({});
  await page.getByRole('button', { name: authored.steps[0].action.label }).click();
  await expect(page.locator('.eigen-mission')).toHaveAttribute('data-attempt-count', '0');
});

test('all stages are accessible on mobile, honor reduced motion, and preserve authored copy', async ({ page }) => {
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
  expect(JSON.parse((await page.locator('.shell').getAttribute('data-assessments'))!)['exit-ticket']).toEqual({ attemptCount: 1, hintUsed: false, isCorrect: true });
});

test('650ms reveal starts before its final endpoint and ends exactly at the computed coordinates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await start(page); const s = missions[0];
  await solve(page, s);
  const arrow = page.locator('[data-vector="1"]');
  expect(Number(await arrow.getAttribute('data-x'))).toBeLessThan(4);
  await expect.poll(async () => Number(await arrow.getAttribute('data-x'))).toBe(4);
  await expect(arrow).toHaveAttribute('data-y', '1');
  await enter(page, 6);
  await solve(page, missions[6]);
  const finalArrow = page.locator('[data-vector="1"]').first();
  expect(Number(await finalArrow.getAttribute('data-x'))).toBeLessThan(6);
  await expect.poll(async () => Number(await finalArrow.getAttribute('data-x'))).toBe(6);
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
