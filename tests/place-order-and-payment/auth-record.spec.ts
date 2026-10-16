import { test, expect } from '@playwright/test';

const sessionFile = 'tests/place-order-and-payment/session.json';

test('Đăng nhập và lưu phiên', async ({ page }) => {
  await page.goto('https://clothing-store-frontend-seven.vercel.app/login');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('user@gmail.com');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).click();
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('Q1w2e3r4');
  await page.getByRole('button', { name: 'ĐĂNG NHẬP' }).click();
  await expect(page).toHaveURL('https://clothing-store-frontend-seven.vercel.app/');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token')))
    .toBeTruthy();
  await page.context().storageState({ path: sessionFile });
});
