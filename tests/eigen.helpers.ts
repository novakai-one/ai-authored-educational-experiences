import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
export const authored = JSON.parse(readFileSync('public/experiences/eigenvector-alignment-lab.json', 'utf8'));
export const missions = authored.steps.filter((s: any) => s.kind === 'custom');
export const url = process.env.ALIGNMENT_PREVIEW_URL ?? '/?experience=eigenvector-alignment-lab';
export async function start(page: Page) {
  await page.goto(url);
  await expect(page.locator('h1')).toHaveText(authored.title);
  await page.getByRole('button', { name: authored.steps[0].action.label, exact: true }).click();
}
export async function fill(page: Page, label: string, value: string) {
  await page.getByRole('textbox', { name: label, exact: true }).or(page.getByRole('spinbutton', { name: label, exact: true })).fill(value);
}
export async function check(page: Page, step: any, key: string) {
  await page.locator('.eigen-mission button[type=submit]').click();
  expect(await page.getByTestId('mission-feedback').textContent()).toBe(step.copy[key]);
}
export async function continuePhase(page: Page, step: any) {
  await page.getByRole('button', { name: step.copy.phaseContinueLabel, exact: true }).click();
  await expect(page.getByTestId('mission-feedback')).toBeEmpty();
  await expect(page.locator('.mission-answer > legend')).toBeFocused();
}
export async function solve(page: Page, step: any) {
  const c = step.copy;
  const phase = () => page.locator('.eigen-mission').getAttribute('data-phase');
  switch (step.config.mode) {
    case 'predict-output': await page.getByLabel(c.choiceA, { exact: true }).check(); break;
    case 'classify-line': await page.getByLabel(c.choiceB, { exact: true }).check(); break;
    case 'hunt-direction': await fill(page, c.xCoordinateLabel, '2'); await fill(page, c.yCoordinateLabel, '0'); break;
    case 'calculate-output': await fill(page, c.firstInputLabel, '3'); await fill(page, c.secondInputLabel, '1'); break;
    case 'classify-and-scale':
      if (await phase() === 'same-line') {
        await page.getByLabel(c.choiceYes, { exact: true }).check(); await check(page, step, 'lineCorrectText'); await continuePhase(page, step);
      }
      await fill(page, c.scaleInputLabel, '-2'); break;
    case 'two-directions':
      if (await phase() === 'choose-directions') {
        await page.getByRole('checkbox', { name: c.candidateA, exact: true }).check(); await page.getByRole('checkbox', { name: c.candidateB, exact: true }).check();
        await check(page, step, 'directionCorrectText'); await continuePhase(page, step);
      }
      await fill(page, c.candidateA + ' ' + c.multiplierLabel, '3'); await fill(page, c.candidateB + ' ' + c.multiplierLabel, '1'); break;
    case 'exit-ticket':
      if (await phase() === 'calculate-output') {
        await fill(page, c.partAFirstInputLabel, '6'); await fill(page, c.partASecondInputLabel, '0');
        await check(page, step, 'outputCorrectText'); await continuePhase(page, step);
      }
      if (await phase() === 'find-eigenvalue') {
        await fill(page, c.partAScaleInputLabel, '3'); await check(page, step, 'scaleCorrectText'); await continuePhase(page, step);
      }
      await page.getByLabel(c.partBNo, { exact: true }).check(); break;
  }
  await page.locator('.eigen-mission button[type=submit]').click();
  await expect(page.getByRole('button', { name: step.actions[0].label, exact: true })).toBeVisible();
}
export async function enter(page: Page, index: number) {
  await start(page);
  for (let i = 0; i < index; i++) { await solve(page, missions[i]); await page.getByRole('button', { name: missions[i].actions[0].label, exact: true }).click(); }
  await expect(page.locator('h2')).toHaveText(missions[index].title);
}
export async function hiddenResult(page: Page, step: any) {
  await expect(page.locator('[data-vector="1"]')).toHaveCount(0);
  await expect(page.getByTestId('mission-result')).toHaveCount(0);
  await expect(page.locator('desc')).not.toContainText([step.copy.graphDescription]);
  expect(await page.locator('body').textContent()).not.toContain(step.copy.a11yReveal);
  expect(await page.locator('body').textContent()).not.toContain(step.copy.revealExplanation);
}
