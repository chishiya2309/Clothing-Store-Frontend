import { test, expect } from '@playwright/test';
import { prepareCart } from './prepare-cart';
import { product, addressShippingCases } from './checkout.data.js';

const BASE_URL = 'https://clothing-store-frontend-seven.vercel.app';
test.use({ storageState: 'tests/place-order-and-payment/session.json', screenshot: 'only-on-failure' });
test.setTimeout(120_000);

for (const tc of addressShippingCases) {
  test(`${tc.id} - ${tc.name}`, async ({ page }, testInfo) => {
    await prepareCart(page, product);
    const address = tc.address;
    const fullAddress = `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`;
    const addressRadio = page.getByRole('radio', { name: `${address.recipientName} ${address.phone} ${fullAddress}` });
    const newAddressButton = page.getByRole('button', { name: 'Thêm mới', exact: true });
    const hasSavedAddress = await newAddressButton.isVisible();
    if (hasSavedAddress) {
      await newAddressButton.click();
    } else {
      // Chưa có địa chỉ: form đã hiện sẵn như CHK_001.
      await expect(page.getByPlaceholder('Họ và tên', { exact: true })).toBeVisible();
    }
    await page.getByPlaceholder('Họ và tên', { exact: true }).fill(address.recipientName);
    await page.getByPlaceholder('Số điện thoại', { exact: true }).fill(address.phone);
    await page.getByRole('combobox').nth(0).selectOption({ label: address.province });
    await page.getByRole('combobox').nth(1).selectOption({ label: address.district });
    await page.getByRole('combobox').nth(2).selectOption({ label: address.ward });
    await page.getByPlaceholder('Địa chỉ cụ thể (Số nhà, tên đường...)', { exact: true }).fill(address.streetAddress);
    await page.getByRole('checkbox', { name: 'Lưu làm địa chỉ mặc định' }).uncheck();
    await page.getByRole('button', { name: 'LƯU VÀ TÍNH PHÍ GIAO HÀNG', exact: true }).click();
    // Checkout đưa địa chỉ vừa tạo lên đầu, kể cả khi trùng thông tin địa chỉ cũ.
    await expect(addressRadio.first()).toBeChecked();
    await expect(page.getByText(`Giao đến: ${fullAddress}`, { exact: true })).toBeVisible();
    const fee = `${tc.shippingFee.toLocaleString('vi-VN')}đ`;
    const shipping = page.getByRole('heading', { name: 'Phương thức vận chuyển', exact: true }).locator('..');
    // Kiểm tra mềm vẫn ghi FAIL, nhưng cho phép chạy tiếp bước xóa địa chỉ mới.
    await expect.soft(shipping.locator('.font-price-display'), `${tc.id}: phí phải là ${fee}`).toHaveText(fee);
    await expect.soft(page.getByText('Phí vận chuyển', { exact: true }).locator('..').locator('span').last()).toHaveText(fee);
    await testInfo.attach('phi-van-chuyen', { body: await page.screenshot(), contentType: 'image/png' });

    // Địa chỉ đầu tiên tự thành mặc định, không xóa được; chỉ dọn địa chỉ thêm sau.
    if (hasSavedAddress) {
      await page.goto(`${BASE_URL}/account/addresses`);
      const card = page.locator('div.rounded-lg').filter({
        has: page.getByRole('heading', { name: address.recipientName, exact: true }),
      }).filter({ hasText: fullAddress }).filter({
        has: page.getByRole('button', { name: /Xóa$/ }),
      });
      await expect(card).toHaveCount(1);
      await card.getByRole('button', { name: /Xóa$/ }).click();
      await page.getByRole('heading', { name: 'Xác nhận xóa', exact: true }).locator('..')
        .getByRole('button', { name: 'Xóa', exact: true }).click();
      await expect(card).toHaveCount(0);
    }
  });
}
