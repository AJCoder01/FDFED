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

test('missing catalog detail shows the missing-service state', async ({ page }) => {
  await page.goto('/services/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Service Not Found' })).toBeVisible();
});

test('a failed workspace page download can be retried', async ({ page }) => {
  const pageModule = /\/(?:assets\/BookingsListPage-[^/]+\.js|src\/features\/customer\/BookingsListPage\.jsx)(?:\?.*)?$/;
  await page.route(pageModule, route => route.abort());
  await login(page, 'customer');
  await page.goto('/customer/bookings');
  await expect(page.getByRole('heading', { name: 'Unable to open this page' })).toBeVisible();
  await page.unroute(pageModule);
  await page.getByRole('button', { name: 'Retry Action' }).click();
  await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
});

test('two tabs restore the same account and logout revokes the shared session', async ({ page, context }) => {
  await login(page, 'customer');
  const secondTab = await context.newPage();
  await secondTab.goto('/customer');
  await expect(secondTab.getByRole('link', { name: /View profile for/ })).toBeVisible();
  await page.getByRole('button', { name: 'Open notifications', exact: false }).click();
  const drawer = page.getByRole('dialog', { name: 'Notifications' });
  await expect(drawer.getByRole('alert')).toBeHidden();
  await drawer.getByRole('button', { name: 'Close notifications' }).click();
  await secondTab.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(secondTab).toHaveURL('/');
  await page.reload();
  await expect(page).toHaveURL('/login');
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
