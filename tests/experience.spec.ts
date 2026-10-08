import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const original = JSON.parse(readFileSync('public/experiences/linear-algebra-demo.json', 'utf8'));
const step = original.steps[0];
const revisionPath = 'public/experiences/content-only-test.json';
test.beforeAll(() => {
  const revision = structuredClone(original);
  revision.id = 'content-only-test';
  revision.title = 'An exact author revision — π';
  revision.steps[0].body[0] = '  Preserve these spaces.\nAnd this authored line.  ';
  revision.steps[0].matrix = [[1, 1], [0, 1]];
  revision.steps[0].visual.animation.durationMs = 0;
  revision.steps[0].answer.feedback.correct.text = 'The revised authored response is displayed verbatim.';
  writeFileSync(revisionPath, JSON.stringify(revision, null, 2));
});
test.afterAll(() => unlinkSync(revisionPath));

test('all feedback is exact authored text; branches and completion obey the specification', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(original.title);
  await expect(page.locator('.notice')).toHaveText(original.notice);
  expect(await page.locator('[data-copy="steps.transform.body.0"]').textContent()).toBe(step.body[0]);
  await expect(page.getByText('UNAPPROVED · PLACEHOLDER', { exact: true })).toBeVisible();
  for (const [x, y, outcome] of [['', '', 'invalid'], ['4', '9', 'x-correct'], ['9', '1', 'y-correct'], ['0', '0', 'incorrect']] as const) {
    await page.getByLabel(step.answer.xLabel, { exact: true }).fill(x);
    await page.getByLabel(step.answer.yLabel, { exact: true }).fill(y);
    await page.getByRole('button', { name: step.answer.submitLabel }).click();
    expect(await page.locator('[role="status"]').textContent()).toBe(step.answer.feedback[outcome].text);
  }
  await page.getByRole('button', { name: 'Inspect the fixture' }).click();
  await expect(page.locator('h2')).toHaveText(original.steps[1].title);
  await expect(page.locator('h2')).toBeFocused();
  await page.getByRole('button', { name: original.steps[1].action.label }).click();
  await page.getByLabel('Output x', { exact: true }).fill('4');
  await page.getByLabel('Output y', { exact: true }).fill('1');
  await page.getByRole('button', { name: step.answer.submitLabel }).click();
  expect(await page.locator('[role="status"]').textContent()).toBe(step.answer.feedback.correct.text);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('h2')).toHaveText(original.steps[2].title);
  await page.getByRole('button', { name: original.steps[2].restart.label }).click();
  await expect(page.getByLabel('Output x', { exact: true })).toHaveValue('');
});

test('keyboard controls update the computation and animation, and invalidate stale answers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('result-coordinates')).toHaveText('(4, 1)');
  await page.getByLabel('Output x', { exact: true }).fill('4');
  await page.getByLabel('Output y', { exact: true }).fill('1');
  await page.getByRole('button', { name: step.answer.submitLabel }).click();
  const before = await page.getByTestId('result-vector').getAttribute('x2');
  const slider = page.getByLabel('Input x', { exact: true });
  await slider.focus();
  await slider.press('ArrowLeft');
  await expect(slider).toHaveValue('1');
  await expect(page.getByTestId('result-coordinates')).toHaveText('(2, 1)');
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Output x', { exact: true })).toHaveValue('');
  const expectedX = 38 + (9 / 14) * 460;
  await expect.poll(async () => Number(await page.getByTestId('result-vector').getAttribute('x2'))).toBeCloseTo(expectedX, 4);
  expect(await page.getByTestId('result-vector').getAttribute('x2')).not.toBe(before);
});

test('a new specification file changes text, mathematics and feedback without application edits', async ({ page }) => {
  await page.goto('/?experience=content-only-test');
  await expect(page.locator('h1')).toHaveText('An exact author revision — π');
  expect(await page.locator('[data-copy="steps.transform.body.0"]').textContent()).toBe('  Preserve these spaces.\nAnd this authored line.  ');
  await expect(page.getByTestId('result-coordinates')).toHaveText('(3, 1)');
  await page.getByLabel('Output x', { exact: true }).fill('3');
  await page.getByLabel('Output y', { exact: true }).fill('1');
  await page.getByRole('button', { name: step.answer.submitLabel }).click();
  await expect(page.locator('[role="status"]')).toHaveText('The revised authored response is displayed verbatim.');
});

for (const [name, mutate, error] of [
  ['unknown interaction', (s: any) => { s.steps[0].interaction.kind = 'unsupported-drag'; }, 'interaction.kind'],
  ['unsupported custom component', (s: any) => { s.steps[0] = { id: 'transform', kind: 'custom', title: 'Fixture', body: ['Fixture'], component: 'unbuilt', version: 1, config: {}, copy: {}, actions: [{ label: 'Fixture', target: 'complete' }, { label: 'Fixture', target: 'fixture-note' }] }; }, 'unsupported component unbuilt@1'],
  ['unapproved content marked approved', (s: any) => { s.status = 'approved'; s.author = 'ChatGPT'; }, 'approval hash'],
] as const) {
  test(`${name} fails visibly with no partial experience`, async ({ page }) => {
    const invalid = structuredClone(original); mutate(invalid);
    await page.route('**/experiences/linear-algebra-demo.json', route => route.fulfill({ json: invalid }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Specification error' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(error);
    await expect(page.getByTestId('result-vector')).toHaveCount(0);
  });
}

test('mobile, reduced motion and automated accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: step.answer.submitLabel })).toBeVisible();
  const slider = page.getByLabel('Input x', { exact: true });
  await slider.fill('3');
  await expect(page.getByTestId('result-coordinates')).toHaveText('(6, 1)');
  // Reduced motion jumps directly to the final endpoint.
  expect(Number(await page.getByTestId('result-vector').getAttribute('x2'))).toBeCloseTo(38 + (13 / 14) * 460, 4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const report = await new AxeBuilder({ page }).analyze();
  expect(report.violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('mobile.png'), fullPage: true });
});
