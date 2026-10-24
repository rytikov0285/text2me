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
  "/experts/",
  "/experts/business-analyst/",
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

  test("CRM links cases and tasks to contacts by stable IDs", async ({ page }) => {
    await page.goto(baseURL + "/space/", { waitUntil: "domcontentloaded" });
    const form = page.locator("#crm-create-form");
    const newButton = page.locator("#crm-new-button");
    const board = page.locator("#crm-board");

    await newButton.click();
    await form.locator('select[name="type"]').selectOption("Контакт");
    await form.locator('input[name="title"]').fill("Контакт E2E");
    await form.locator('button[type="submit"]').click();
    await expect(board).toContainText("Контакт E2E");

    await newButton.click();
    await form.locator('select[name="type"]').selectOption("Дело");
    await form.locator('input[name="title"]').fill("Дело E2E");
    await form.locator('select[name="contactIds"]').selectOption({ label: "Контакт E2E" });
    await form.locator('button[type="submit"]').click();
    await expect(board).toContainText("Дело E2E");
    await expect(board).toContainText("Контакт E2E");

    await newButton.click();
    await form.locator('select[name="type"]').selectOption("Задача");
    await form.locator('input[name="title"]').fill("Задача E2E");
    await form.locator('select[name="caseId"]').selectOption({ label: "Дело E2E" });
    await form.locator('select[name="contactIds"]').selectOption({ label: "Контакт E2E" });
    await form.locator('button[type="submit"]').click();
    await expect(board).toContainText("Задача E2E");

    await newButton.click();
    await form.locator('select[name="type"]').selectOption("Документ");
    await form.locator('input[name="title"]').fill("Документ E2E");
    await form.locator('select[name="caseId"]').selectOption({ label: "Дело E2E" });
    await form.locator('select[name="contactIds"]').selectOption({ label: "Контакт E2E" });
    await form.locator('button[type="submit"]').click();
    await expect(board).toContainText("Документ E2E");

    await page.goto(baseURL + "/calendar/", { waitUntil: "domcontentloaded" });
    await page.locator("#add").click();
    await page.locator("#name").fill("Событие E2E");
    await page.locator("#eventCase").selectOption({ label: "Дело E2E" });
    await page.locator("#eventDocument").selectOption({ label: "Документ E2E" });
    await page.locator("#eventContacts").selectOption({ label: "Контакт E2E" });
    await page.locator('#form button[type="submit"]').click();
    await expect(page.locator("#events")).toContainText("Событие E2E");
    await expect(page.locator("#events")).toContainText("Дело: Дело E2E");
    await expect(page.locator("#events")).toContainText("Документ: Документ E2E");
    await expect(page.locator("#events")).toContainText("Контакты: Контакт E2E");
  });

  test("shared navigation avoids duplicate audience and quick-access links", async ({ page }) => {
    await page.goto(baseURL + "/documents/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".global-audience-switcher")).toHaveCount(0);
    await expect(page.locator('.portal-shell-audience a[href="/text2me/business/"]')).toHaveCount(1);
    await expect(page.locator('.portal-shell-nav a[href="/text2me/business/"]')).toHaveCount(0);
    await expect(page.locator('.text2me-rail-right a[href="/text2me/government/"]')).toHaveCount(0);
    await expect(page.locator('.text2me-rail-left a[href="/text2me/government/"]')).toHaveCount(1);
    await expect(page.locator('.text2me-service-network a[href="/text2me/"]')).toHaveCount(0);
  });

  test("dashboard has one context-specific action for each record type", async ({ page }) => {
    await page.goto(baseURL + "/dashboard/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#addTaskTop")).toHaveCount(0);
    await expect(page.locator("#addEventTop")).toHaveCount(0);
    await expect(page.locator("#addTask")).toHaveText("＋ Новая задача");
    await expect(page.locator("#addEvent")).toHaveText("＋ Новое событие");
  });

  test("homepage title search submits on Enter and does not search situation descriptions", async ({ page }) => {
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    const input = page.locator("#title-search");
    const results = page.locator("#title-search-results");
    const status = page.locator("#title-search-status");

    await input.fill("Исковое заявление");
    await input.press("Enter");
    await expect(results).toContainText("Исковое заявление");
    await expect(results.locator("a").first()).toHaveAttribute("href", /documents\/isk-v-sud/);

    await input.fill("снимаю квартиру хочу зафиксировать условия");
    await input.press("Enter");
    await expect(status).toContainText("Для описания обстоятельств");
    await expect(results.locator("a")).toHaveCount(0);
  });

  test("start page title search shows results on Enter and leaves situation shortcuts available", async ({ page }) => {
    await page.goto(baseURL + "/start/", { waitUntil: "domcontentloaded" });
    const input = page.locator("#search-input");
    const status = page.locator("#search-status");

    await input.fill("Исковое заявление");
    await input.press("Enter");
    await expect(status).toContainText("Найдено документов по названию: 1");
    await expect(page.locator("#catalog-cards [data-search-item]:visible")).toHaveCount(1);
    await expect(page.locator("#quick-actions a:visible").first()).toBeVisible();

    await input.fill("вернуть деньги за товар");
    await input.press("Enter");
    await expect(status).toContainText("Для описания ситуации");
    await expect(page.locator("#quick-actions a:visible").first()).toBeVisible();
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
  test.setTimeout(45000);
  await test.step("open the claim form", async () => {
    await page.goto(`${baseURL}/documents/pretenziya-prodavtsu/`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#claim-builder")).toBeVisible();
  });
  await test.step("complete the parties step and continue to purchase details", async () => {
    await page.locator("#seller-name").fill("Тестовый продавец");
    await page.locator("#buyer-name").fill("Тестовый покупатель");
    await page.getByRole("button", { name: "Продолжить" }).click();
    await expect(page.locator("#product-name")).toBeVisible();
  });
  await test.step("fill purchase details and generate the draft", async () => {
    await page.locator("#product-name").fill("Тестовый товар");
    await page.locator("#defect-description").fill("Тестовое описание недостатка товара.");
    await page.locator("#claim-demand").selectOption("refund");
    await page.getByRole("button", { name: "Сформировать черновик" }).click();
    const output = page.locator("#claim-output");
    await expect(output).toContainText("Тестовый продавец");
    await expect(output).toContainText("Тестовый покупатель");
    await expect(output).toContainText("Тестовое описание недостатка товара.");
  });
  await test.step("download the generated text", async () => {
    const downloadPromise = page.waitForEvent("download", { timeout: 8000 });
    await page.locator("#download-claim").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().endsWith(".txt")).toBeTruthy();
  });
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
