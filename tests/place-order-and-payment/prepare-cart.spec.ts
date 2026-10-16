import { test } from "@playwright/test";
import { prepareCart } from "./prepare-cart";

const sessionFile = "tests/place-order-and-payment/session.json";

test.use({ storageState: sessionFile, screenshot: "only-on-failure" });
test.setTimeout(90_000);

test("Chuẩn bị giỏ hàng: đúng một sản phẩm Xám, size L", async ({ page }) => {
  await prepareCart(page);
});
