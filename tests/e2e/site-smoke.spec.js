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
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
      expect(response, `No HTTP response for ${route}`).not.toBeNull();
      expect(response.status(), `Unexpected HTTP status for ${route}`).toBe(200);
      await expect(page.locator("body")).not.toBeEmpty();
      await page.waitForTimeout(300);
      expect(pageErrors, `Uncaught JavaScript errors on ${route}`).toEqual([]);
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

test("consumer claim form generates a draft and downloadable text", async ({ page }) => {
  await page.goto(`${baseURL}/documents/pretenziya-prodavtsu/`, { waitUntil: "domcontentloaded" });
  await page.locator("#seller-name").fill("Тестовый продавец");
  await page.locator("#buyer-name").fill("Тестовый покупатель");
  await page.locator("#product-name").fill("Тестовый товар");
  await page.locator("#defect-description").fill("Тестовое описание недостатка товара.");
  await page.locator("#claim-demand").selectOption("refund");
  await page.getByRole("button", { name: "Сформировать черновик" }).click();
  const output = page.locator("#claim-output");
  await expect(output).toContainText("Тестовый продавец");
  await expect(output).toContainText("Тестовый покупатель");
  await expect(output).toContainText("Тестовое описание недостатка товара.");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-claim").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().endsWith(".txt")).toBeTruthy();
});

test("flood workflow creates a draft, saves locally, and downloads it", async ({ page }) => {
  await page.goto(`${baseURL}/situations/zatoplenie-kvartiry/`, { waitUntil: "domcontentloaded" });
  await page.locator("#f-name").fill("Тестовый заявитель");
  await page.locator("#f-address").fill("Тестовый адрес, дом 1");
  await page.locator("#f-date").fill("2026-10-24");
  await page.locator("#f-damage").fill("Повреждение потолка в комнате");
  await page.locator("#flood-intake button[type=submit]").click();
  await expect(page.locator("#first-document")).toBeVisible();
  await expect(page.locator("#flood-draft")).toHaveValue(/Тестовый заявитель/);
  await expect(page.locator("#flood-draft")).toHaveValue(/Тестовый адрес, дом 1/);
  await page.locator("#save-first").click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("text2me.space.v1") || "[]"));
  expect(saved.some(doc => doc.title && doc.text && doc.text.includes("Тестовый заявитель"))).toBeTruthy();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-first").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().endsWith(".txt")).toBeTruthy();
});

test("calendar event persists after reload", async ({ page }) => {
  await page.goto(`${baseURL}/calendar/`, { waitUntil: "domcontentloaded" });
  await page.locator("#add").click();
  const eventDate = await page.evaluate(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  });
  await page.locator("#name").fill("E2E: контрольный срок");
  await page.locator("#date").fill(eventDate);
  await page.locator("#description").fill("Проверка локального сохранения");
  await page.locator("#form button[type=submit]").click();
  await expect(page.locator("#events")).toContainText("E2E: контрольный срок");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("text2me.dashboard.v1") || "{}"));
  expect(saved.events.some(event => event.name === "E2E: контрольный срок")).toBeTruthy();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#events")).toContainText("E2E: контрольный срок");
});
