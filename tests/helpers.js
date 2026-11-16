import { expect } from '@playwright/test';
const emails = { customer:'aarav@gmail.com', provider:'rohan@gmail.com', admin:'staffadmin@gmail.com', arbitrator:'kabir@gmail.com', superuser:'admin@gmail.com' };
export async function login(page, role, email=emails[role]) {
  const route=role==='superuser'?'admin':role;
  await page.goto(`/login?role=${route}`);
  await page.getByLabel('Email Address').fill(email);
  await page.locator('input[type=password]').fill('123456Ab@');
  await page.getByRole('button', {name:/^Sign In as /}).click();
  await expect(page).toHaveURL(new RegExp(`/${route}$`));
}
export async function navigate(page, path) {
  await page.evaluate(path => { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }, path);
  await page.locator('main').waitFor();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
