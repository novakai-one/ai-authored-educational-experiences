import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { authored, url, missions, solve, fill, check, continuePhase } from './eigen.helpers';

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`review evidence: initial, error, hint and every phase at ${viewport.name} size`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize(viewport);
    const directory = process.env.EVIDENCE_DIR ?? info.outputPath('screenshots'); mkdirSync(directory, { recursive: true });
    const manifest: object[] = [];
    await page.goto(url);
    await expect(page.locator('h2')).toHaveText(authored.steps[0].title);
    await page.screenshot({ path: join(directory, `${viewport.name}-00-briefing.png`), fullPage: true });
    await page.getByRole('button', { name: authored.steps[0].action.label, exact: true }).click();
    for (const [i, step] of missions.entries()) {
      const c = step.copy;
      const shot = async (state: string) => {
        // Observe endpoints, not a fixed animation delay, before saving review evidence.
        const config = step.config;
        const revealed = await page.locator('.eigen-mission').getAttribute('data-solved') === 'true';
        const vectors = config.mode === 'two-directions' ? (revealed ? config.candidates.slice(0, 2).map((v: any) => v.vector) : [])
          : config.mode === 'exit-ticket' ? (revealed ? config.questions.map((v: any) => v.vector) : [])
          : config.mode === 'hunt-direction' ? [[Number(await page.getByLabel(c.xCoordinateLabel).inputValue()), Number(await page.getByLabel(c.yCoordinateLabel).inputValue())]]
          : revealed || config.resultVisibility === 'initial' ? [config.vector] : [];
        const expected = vectors.map((v: number[]) => config.matrix.map((r: number[]) => r[0] * v[0] + r[1] * v[1]));
        await expect.poll(() => page.locator('[data-vector="1"]').evaluateAll(nodes => nodes.map(n => [Number(n.getAttribute('data-x')), Number(n.getAttribute('data-y'))]))).toEqual(expected);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        // Verify every rendered vector really has two aligned rows, including inside copy.
        expect(await page.locator('.column-vector').evaluateAll(nodes => nodes.every(node => {
          const rows = [...node.querySelectorAll('.vector-component')].map(child => child.getBoundingClientRect());
          return rows.length === 2 && rows[1].top >= rows[0].bottom && Math.abs((rows[0].left + rows[0].right) - (rows[1].left + rows[1].right)) < 1;
        }))).toBe(true);
        const phase = await page.locator('.eigen-mission').getAttribute('data-phase');
        const filename = `${viewport.name}-${String(i + 1).padStart(2, '0')}-${phase}-${state}.png`;
        await page.mouse.move(0, 0);
        await page.screenshot({ path: join(directory, filename), fullPage: true });
        manifest.push({ filename, stage: i + 1, phase, state, title: step.title,
          question: await page.locator('.mission-answer > legend').textContent(),
          feedback: await page.getByTestId('mission-feedback').textContent(), hint: await page.locator('.mission-hint').count() ? await page.locator('.mission-hint').textContent() : null, results: expected });
        if (state === 'final') await expect(page.getByRole('button', { name: step.actions[0].label, exact: true })).toBeInViewport();
        if (state === 'intermediate') await expect(page.getByRole('button', { name: c.phaseContinueLabel, exact: true })).toBeInViewport();
        if (state === 'initial' || state === 'intermediate') expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      };
      const hint = async () => { await page.getByRole('button', { name: c.hintLabel, exact: true }).click(); await shot('hint'); };
      await expect(page.locator('h2')).toHaveText(step.title);
      await shot('initial');
      switch (step.config.mode) {
        case 'predict-output':
          await page.getByLabel(c.choiceB, { exact: true }).check(); await check(page, step, 'feedbackB'); await shot('wrong'); await hint(); break;
        case 'classify-line':
          await page.getByLabel(c.choiceA, { exact: true }).check(); await check(page, step, 'feedbackA'); await shot('wrong'); await hint(); break;
        case 'hunt-direction':
          await check(page, step, 'feedbackTurned'); await shot('wrong'); await hint();
          await fill(page, c.xCoordinateLabel, '0'); await fill(page, c.yCoordinateLabel, '0'); await check(page, step, 'feedbackZero'); await shot('zero'); break;
        case 'calculate-output':
          await fill(page, c.firstInputLabel, '0'); await fill(page, c.secondInputLabel, '0'); await check(page, step, 'feedbackNeither'); await shot('wrong'); await hint(); break;
        case 'classify-and-scale':
          await page.getByLabel(c.choiceNo, { exact: true }).check(); await check(page, step, 'feedbackWrongLine'); await shot('wrong'); await hint();
          await page.getByLabel(c.choiceYes, { exact: true }).check(); await check(page, step, 'lineCorrectText'); await shot('intermediate');
          await continuePhase(page, step); await shot('initial');
          await fill(page, c.scaleInputLabel, '2'); await check(page, step, 'feedbackPositiveScale'); await shot('wrong'); await hint(); break;
        case 'two-directions':
          for (const id of ['C', 'D']) await page.getByRole('checkbox', { name: c['candidate' + id], exact: true }).check();
          await check(page, step, 'feedbackContainsC'); await shot('wrong'); await hint();
          for (const id of ['C', 'D']) await page.getByRole('checkbox', { name: c['candidate' + id], exact: true }).uncheck();
          for (const id of ['A', 'B']) await page.getByRole('checkbox', { name: c['candidate' + id], exact: true }).check();
          await check(page, step, 'directionCorrectText'); await shot('intermediate');
          await continuePhase(page, step); await shot('initial');
          await fill(page, c.candidateA + ' ' + c.multiplierLabel, '2'); await fill(page, c.candidateB + ' ' + c.multiplierLabel, '2');
          await check(page, step, 'feedbackWrongScaleA'); await shot('wrong'); await hint(); break;
        case 'exit-ticket':
          await fill(page, c.partAFirstInputLabel, '5'); await fill(page, c.partASecondInputLabel, '1');
          await check(page, step, 'feedbackWrongOutput'); await shot('wrong'); await hint();
          await fill(page, c.partAFirstInputLabel, '6'); await fill(page, c.partASecondInputLabel, '0');
          await check(page, step, 'outputCorrectText'); await shot('intermediate');
          await continuePhase(page, step); await shot('initial');
          await fill(page, c.partAScaleInputLabel, '2'); await check(page, step, 'feedbackWrongScale'); await shot('wrong'); await hint();
          await fill(page, c.partAScaleInputLabel, '3'); await check(page, step, 'scaleCorrectText'); await shot('intermediate');
          await continuePhase(page, step); await shot('initial');
          await page.getByLabel(c.partBYes, { exact: true }).check(); await check(page, step, 'feedbackWrongClassification'); await shot('wrong'); await hint(); break;
      }
      await solve(page, step); await shot('final');
      await page.getByRole('button', { name: step.actions[0].label, exact: true }).click();
    }
    await expect(page.locator('h2')).toHaveText(authored.steps[8].title);
    const closing = page.locator('.step-heading p');
    for (let i = 0; i < authored.steps[8].body.length; i++) expect(await closing.nth(i).textContent()).toBe(authored.steps[8].body[i]);
    await page.screenshot({ path: join(directory, `${viewport.name}-08-completion.png`), fullPage: true });
    writeFileSync(join(directory, `${viewport.name}-manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
    expect(errors).toEqual([]);
  });
}
