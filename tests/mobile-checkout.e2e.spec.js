import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('booking wizard details, price review and payment fit narrow phones', async ({ page }, info) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await login(page, 'customer');
  let date = new Date(Date.now() + 30 * 86400000);
  while (date.getUTCDay() === 0) date = new Date(+date + 86400000);
  await page.goto('/services/srv-1');
  await page.getByLabel('1. Select Preferred Date:').fill(date.toISOString().slice(0, 10));
  await page.getByRole('button', { name: '09:00 AM', exact: true }).click();
  await page.getByRole('button', { name: /Proceed to Booking/ }).click();
  const inspect = async step => {
    for (const width of [320, 375, 414]) {
      await page.setViewportSize({ width, height: 850 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        const failures = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          const control = node.parentElement.closest('button');
          const bounds = control?.getBoundingClientRect() || { left: 0, right: width };
          if (rect.width && rect.height && (rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(width, bounds.right) + 1)) failures.push(node.textContent.trim());
        }
        return failures;
      });
      expect(overflow, `${step} at ${width}px has overflowing text`).toEqual([]);
      await page.screenshot({ path: info.outputPath(`checkout-${step}-${width}.png`), fullPage: true });
    }
  };
  await expect(page.getByRole('button', { name: /Continue to Price Review/ })).toBeVisible();
  await inspect('details');
  await page.getByRole('button', { name: /Continue to Price Review/ }).click();
  await inspect('review');
  await page.getByRole('button', { name: /Proceed to Demo Payment/ }).click();
  await inspect('payment');
  await page.getByLabel('Payment Option').selectOption('Cash After Service');
  await inspect('cash');
});
