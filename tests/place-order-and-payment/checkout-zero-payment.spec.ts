import { test, expect } from '@playwright/test';
import { prepareCart } from './prepare-cart';
import { product, zeroPaymentCheckout, zeroPaymentCases } from './checkout.data.js';

const BASE_URL = 'https://clothing-store-frontend-seven.vercel.app';
test.use({ storageState: 'tests/place-order-and-payment/session.json', screenshot: 'only-on-failure' });

test.setTimeout(120_000);

for (const tc of zeroPaymentCases) {
  test(`${tc.id} - ${tc.name}`, async ({ page }) => {
    await prepareCart(page, product);
    const data = zeroPaymentCheckout;
    const address = data.address;
    const fullAddress = `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`;
    const addressRadio = page.getByRole('radio', { name: `${address.recipientName} ${address.phone} ${fullAddress}` });
    await expect(addressRadio, 'Chuẩn bị: cần lưu đúng địa chỉ tester1').toHaveCount(1);
    await addressRadio.locator('..').click();
    await expect(addressRadio).toBeChecked();
    await expect(page.getByText('Phí vận chuyển', { exact: true }).locator('..').locator('span').last())
      .toHaveText(`${data.shippingFee.toLocaleString('vi-VN')}đ`);
    await page.getByText(tc.paymentLabel, { exact: true }).click();
    await expect(page.getByRole('radio', { name: tc.paymentLabel })).toBeChecked();
    await page.getByRole('textbox', { name: 'Mã giảm giá sản phẩm', exact: true }).fill(data.productVoucherCode);
    await page.getByRole('button', { name: 'ÁP DỤNG', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'ĐÃ ÁP DỤNG', exact: true })).toHaveCount(1);
    await page.getByRole('textbox', { name: 'Mã giảm phí vận chuyển', exact: true }).fill(data.shippingVoucherCode);
    await page.getByRole('button', { name: 'ÁP DỤNG', exact: true }).click();
    await expect(page.getByRole('button', { name: 'ĐÃ ÁP DỤNG', exact: true })).toHaveCount(2);
    await expect(page.getByText('Giảm giá sản phẩm', { exact: true }).locator('..').locator('span').last())
      .toHaveText(`-${data.productDiscountAmount.toLocaleString('vi-VN')}đ`);
    await expect(page.getByText('Giảm phí vận chuyển', { exact: true }).locator('..').locator('span').last())
      .toHaveText(`-${data.shippingDiscountAmount.toLocaleString('vi-VN')}đ`);
    await expect(page.getByText('Tổng cộng', { exact: true }).locator('..').locator('span').last()).toHaveText('0đ');
    await page.getByRole('button', { name: tc.submitLabel, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đặt hàng thành công', exact: true }),
      `${tc.id}: tổng 0đ phải tạo được đơn thành công trên website`).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(`${BASE_URL}/checkout/result`);
    await expect(page.getByText(tc.resultPaymentLabel, { exact: true })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Phương thức thanh toán', exact: true }).locator('../..'))
      .toContainText(new RegExp(tc.method, 'i'));
    await expect(page.getByText('Tổng cộng', { exact: true }).locator('..').locator('span').last()).toHaveText('0₫');
    // Nếu tạo được đơn, dọn đúng đơn vừa tạo bằng giao diện.
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đơn hàng đã bị hủy', exact: true })).toBeVisible();
  });
}
