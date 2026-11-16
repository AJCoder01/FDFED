import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login, navigate } from './helpers';

test('catalog recovers from an API outage and displays empty search results', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route('**/api/v1/services?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Catalog temporarily unavailable.' }) }));
  await page.goto('/services');
  await expect(page.getByText('Catalog temporarily unavailable.')).toBeVisible();
  await page.unroute('**/api/v1/services?**');
  await page.getByRole('button', { name: 'Retry Action' }).click();
  await expect(page.getByRole('heading', { name: 'Split AC Servicing & Deep Foam Clean' })).toBeVisible();
  await page.getByPlaceholder('Search by title, category, or description...').fill('no-such-service-qa');
  await expect(page.getByRole('heading', { name: 'No Matching Services Found' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('protected routes reject guests and wrong roles without crashing', async ({ page }) => {
  await page.goto('/admin/revenue');
  await expect(page).toHaveURL(/\/login$/);
  await login(page, 'customer');
  await page.goto('/admin/accounts');
  await expect(page).toHaveURL(/\/customer$/);
  await page.goto('/customer/bookings/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
  await navigate(page, '/customer');
  await expect(page.getByRole('heading', { name: /Welcome|Dashboard/ }).first()).toBeVisible();
});

test('demo controller switches actors after authentication completes', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 375, height: 850 });
  await login(page, 'superuser');
  const actors = [ ['Aarav Mehta', '/customer'], ['Rohan Verma', '/provider'], ['Kabir Malhotra', '/arbitrator'], ['Priya Nair', '/admin'], ['Naina Kapoor', '/admin'] ];
  for (const [name, path] of actors) {
    await page.getByTitle(`Switch demo actor to ${name}`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('link', { name: `View profile for ${name}` })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.waitForLoadState('networkidle');
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(scan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.html) }))).toEqual([]);
  await page.getByTitle('Switch demo actor to Public Visitor').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('ServiceHub Demo Switcher:')).not.toBeVisible();
});
