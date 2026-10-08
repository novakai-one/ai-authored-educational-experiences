import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { missions, start, solve } from './eigen.helpers';

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`review evidence: all seven before/after states at ${viewport.name} size`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize(viewport); await start(page);
    const directory = process.env.EVIDENCE_DIR ?? info.outputPath('screenshots'); mkdirSync(directory, { recursive: true });
    for (const [i, step] of missions.entries()) {
      await expect(page.locator('h2')).toHaveText(step.title);
      await page.screenshot({ path: join(directory, viewport.name + '-' + String(i + 1).padStart(2, '0') + '-before.png'), fullPage: true });
      await solve(page, step);
      const c = step.config;
      const vectors = c.mode === 'two-directions' ? c.candidates.slice(0, 2).map((v: any) => v.vector)
        : c.mode === 'exit-ticket' ? c.questions.map((v: any) => v.vector)
        : [c.mode === 'hunt-direction' ? [2, 0] : c.vector];
      const expected = vectors.map((v: number[]) => c.matrix.map((r: number[]) => r[0] * v[0] + r[1] * v[1]));
      await expect.poll(() => page.locator('[data-vector="1"]').evaluateAll(nodes => nodes.map(n => [Number(n.getAttribute('data-x')), Number(n.getAttribute('data-y'))]))).toEqual(expected);
      await page.screenshot({ path: join(directory, viewport.name + '-' + String(i + 1).padStart(2, '0') + '-after.png'), fullPage: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: step.actions[0].label, exact: true }).click();
    }
    expect(errors).toEqual([]);
  });
}
