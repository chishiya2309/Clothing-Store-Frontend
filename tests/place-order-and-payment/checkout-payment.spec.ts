import { test, expect } from '@playwright/test';
import { prepareCart } from './prepare-cart';
import { product, paymentCheckout, paymentCases } from './checkout.data.js';

const BASE_URL = 'https://clothing-store-frontend-seven.vercel.app';
test.use({ storageState: 'tests/place-order-and-payment/session.json', screenshot: 'only-on-failure' });
test.setTimeout(120_000);

for (const tc of paymentCases) {
  test(`${tc.id} - ${tc.name}`, async ({ page }) => {
    await prepareCart(page, product);
    const data = paymentCheckout;
    const address = data.address;
    const fullAddress = `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`;
    const addressRadio = page.getByRole('radio', { name: `${address.recipientName} ${address.phone} ${fullAddress}` });
    await expect(addressRadio, 'Chuẩn bị: cần lưu đúng địa chỉ tester1').toHaveCount(1);
    await addressRadio.locator('..').click();
    await expect(addressRadio).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Mã giảm giá sản phẩm', exact: true })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Mã giảm phí vận chuyển', exact: true })).toHaveValue('');
    await expect(page.getByText('Phí vận chuyển', { exact: true }).locator('..').locator('span').last())
      .toHaveText(`${data.shippingFee.toLocaleString('vi-VN')}đ`);
    await expect(page.getByText('Tổng cộng', { exact: true }).locator('..').locator('span').last())
      .toHaveText(`${data.totalAmount.toLocaleString('vi-VN')}đ`);
    await page.getByText(tc.paymentLabel, { exact: true }).click();
    await expect(page.getByRole('radio', { name: tc.paymentLabel })).toBeChecked();
    await page.getByRole('button', { name: tc.submitLabel, exact: true }).click();

    if (tc.method !== 'cod') {
      await page.waitForURL((url) => url.origin === tc.gatewayOrigin, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await expect(page.getByText(tc.gatewayReadyText!, { exact: true })).toBeVisible({ timeout: 15_000 });
      return;
    }

    await expect(page.getByRole('heading', { name: 'Đặt hàng thành công', exact: true })).toBeVisible();
    await expect(page).toHaveURL(`${BASE_URL}/checkout/result`);
    await expect(page.getByText('Thanh toán khi nhận hàng', { exact: true })).toBeVisible();
    const orderCode = (await page.getByText('Mã đơn hàng', { exact: true }).locator('..').locator('span').last().innerText()).trim();
    expect(orderCode).toMatch(/^#\S+$/);
    await page.getByRole('link', { name: 'Xem chi tiết đơn', exact: true }).click();
    await expect(page).toHaveURL(`${BASE_URL}/account/orders/${orderCode.slice(1)}`);
    await expect(page.getByRole('heading', { name: `Đơn hàng ${orderCode}` })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sản phẩm (1)', exact: true })).toBeVisible();
    const item = page.getByRole('link', { name: product.name, exact: true });
    await expect(item).toBeVisible();
    await expect(item.locator('..')).toContainText(product.color);
    await expect(item.locator('..')).toContainText(new RegExp(`\\b${product.size}\\b`));
    await expect(item.locator('../..').getByText(`${product.unitPrice.toLocaleString('vi-VN')}₫`, { exact: true }).first()).toBeVisible();
    const shipping = page.getByRole('heading', { name: 'Thông tin giao hàng', exact: true }).locator('../..');
    await expect(shipping).toContainText(address.recipientName);
    await expect(shipping).toContainText(address.phone);
    await expect(shipping).toContainText(address.streetAddress);
    await expect(shipping).toContainText(address.ward);
    await expect(shipping).toContainText(address.district);
    await expect(shipping).toContainText(address.province);
    const payment = page.getByRole('heading', { name: 'Phương thức thanh toán', exact: true }).locator('../..');
    await expect(payment).toContainText(/cod/i);
    await expect(payment.getByText('Chưa thanh toán', { exact: true })).toBeVisible();
    await expect(page.getByText('Tổng cộng', { exact: true }).locator('..').locator('span').last())
      .toHaveText(`${data.totalAmount.toLocaleString('vi-VN')}₫`);
    // Dọn đúng đơn vừa tạo bằng các nút trên giao diện.
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đơn hàng đã bị hủy', exact: true })).toBeVisible();
  });
}
