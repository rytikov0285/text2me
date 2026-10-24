const { test, expect } = require("@playwright/test");

const baseURL = "https://rytikov0285.github.io/text2me";
const keyRoutes = [
  "/",
  "/start/",
  "/documents/",
  "/documents/pretenziya-prodavtsu/",
  "/documents/isk-v-sud/",
  "/situations/zatoplenie-kvartiry/",
  "/calendar/",
  "/dashboard/",
  "/request/",
];

test.describe("text2me published-site smoke tests", () => {
  for (const route of keyRoutes) {
    test(`route loads: ${route}`, async ({ page }) => {
      const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
      expect(response, `No HTTP response for ${route}`).not.toBeNull();
      expect(response.status(), `Unexpected HTTP status for ${route}`).toBe(200);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }

  test("shared search dialog opens, accepts text, and closes with Escape", async ({ page }) => {
    await page.goto(baseURL + "/documents/", { waitUntil: "domcontentloaded" });
    const opener = page.locator(".portal-shell-search").first();
    await expect(opener).toBeVisible();
    await opener.click();
    const dialog = page.locator(".portal-shell-dialog");
    await expect(dialog).toBeVisible();
    const input = dialog.locator('input[type="search"]');
    await input.fill("претензия продавцу");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  for (const width of [320, 375, 768, 1024, 1280, 1440]) {
    test(`homepage has no document-level horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(
        dimensions.document,
        `Horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`
      ).toBeLessThanOrEqual(dimensions.viewport + 1);
    });
  }
});
