import { test, expect } from '@playwright/test';
import { prepareCart } from './prepare-cart';
import { product, noAddressCases } from './checkout.data.js';

test.use({ storageState: 'tests/place-order-and-payment/session.json', screenshot: 'only-on-failure' });
test.setTimeout(90_000);

for (const tc of noAddressCases) {
  test(`${tc.id} - ${tc.name}`, async ({ page }) => {
    await prepareCart(page, product);
    await expect(page.getByRole('button', { name: 'Đã lưu', exact: true }),
      'Chuẩn bị CHK_001: tài khoản phải chưa có địa chỉ đã lưu').toHaveCount(0);
    await expect(page.getByPlaceholder('Họ và tên', { exact: true })).toHaveValue('');
    await expect(page.getByPlaceholder('Số điện thoại', { exact: true })).toHaveValue('');
    await expect(page.getByPlaceholder('Địa chỉ cụ thể (Số nhà, tên đường...)', { exact: true })).toHaveValue('');
    await expect(page.getByRole('combobox').nth(0)).toHaveValue('');
    await expect(page.getByRole('combobox').nth(1)).toHaveValue('');
    await expect(page.getByRole('combobox').nth(2)).toHaveValue('');
    await page.getByText(tc.paymentLabel, { exact: true }).click();
    await expect(page.getByRole('radio', { name: tc.paymentLabel })).toBeChecked();
    await page.getByRole('button', { name: tc.submitLabel, exact: true }).click();
    await expect(page.getByText(tc.expectedError, { exact: true })).toBeVisible();
    await expect(page).toHaveURL('https://clothing-store-frontend-seven.vercel.app/checkout');
  });
}
