import { expect, type Page } from '@playwright/test';
import { product } from './checkout.data.js';

const BASE_URL = 'https://clothing-store-frontend-seven.vercel.app';

export async function prepareCart(page: Page, productData = product) {
  // Chờ tải xong dữ liệu, tránh nhầm màn hình rỗng ban đầu là giỏ đã rỗng.
  await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /^(Giỏ hàng trống|Giỏ hàng của bạn \(\d+ sản phẩm\))$/,
  );
  await expect(page.getByText('Đang tải giỏ hàng...', { exact: true })).toBeHidden();
  const removeButtons = page.getByRole('button', { name: 'Remove item', exact: true });
  while (await removeButtons.count() > 0) {
    const count = await removeButtons.count();
    page.once('dialog', (dialog) => dialog.accept());
    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(count - 1);
  }
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Giỏ hàng trống', exact: true })).toBeVisible();

  // Giữ luồng chọn sản phẩm đã record bằng Codegen.
  await page.getByRole('link', { name: 'TIẾP TỤC MUA SẮM' }).click();
  await page.getByRole('link', { name: 'NAM expand_more' }).click();
  await page.getByRole('link', { name: 'Quần Nam chevron_right' }).click();
  await page.getByRole('link', { name: 'Quần Kaki Nam' }).click();
  await page.getByRole('link', { name: productData.name }).click();
  await page.getByRole('button', { name: productData.color, exact: true }).click();
  await page.getByRole('button', { name: productData.size, exact: true }).click();
  await expect(page.getByRole('main').first().locator('input[readonly]'))
    .toHaveValue(String(productData.quantity));
  const added = page.waitForEvent('dialog').then(async (dialog) => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await page.getByRole('button', { name: 'THÊM VÀO GIỎ HÀNG', exact: true }).click();
  expect(await added).toBe(`Đã thêm ${productData.quantity} sản phẩm vào giỏ hàng!`);

  // Kiểm tra giỏ chỉ có đúng một sản phẩm rồi mở checkout.
  await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Giỏ hàng của bạn (1 sản phẩm)');
  await expect(removeButtons).toHaveCount(1);
  const item = page.getByRole('main').locator('div.group').filter({
    has: page.getByRole('heading', { name: productData.name, level: 3, exact: true }),
  });
  await expect(item).toHaveCount(1);
  await expect(item.getByText(`${productData.color} • Size ${productData.size}`, { exact: true })).toBeVisible();
  await expect(item.getByText(`${productData.unitPrice.toLocaleString('vi-VN')}đ`, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'TIẾN HÀNH THANH TOÁN', exact: true }).click();
  await expect(page).toHaveURL(`${BASE_URL}/checkout`);
  await expect(page.getByRole('heading', { name: 'Thông tin giao hàng', exact: true })).toBeVisible();
  await expect(page.getByText('Đang tải sổ địa chỉ...', { exact: true })).toBeHidden();
}
