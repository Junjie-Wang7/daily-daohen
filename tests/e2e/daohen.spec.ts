import { expect, test } from "@playwright/test";

test.setTimeout(60000);

test("user can preview and confirm import before restoring a journal entry", async ({ page }, testInfo) => {
  await page.goto("/");

  const dateInput = page.locator('input[type="date"]');
  await expect(page.locator("textarea")).toHaveCount(7);
  const currentDate = await dateInput.inputValue();

  const originalAnswers = [
    "今天和同事讨论时起了波澜。",
    "我先想反驳。",
    "我其实担心自己没被理解。",
    "我害怕关系变僵。",
    "我告诉自己先忍一下。",
    "主石头是我过度防御。",
    "明天我会先确认事实再表达感受。",
  ];

  const textareas = page.locator("textarea");
  for (const [index, answer] of originalAnswers.entries()) {
    await textareas.nth(index).fill(answer);
  }

  await page.locator('input:not([type="date"])').first().fill("工作, 关系");
  await page.locator("button").first().click();

  await page.goto("/history");

  const exportDownload = page.waitForEvent("download");
  await page.getByTestId("export-json-button").click();
  const exportedFile = await exportDownload;
  const exportedPath = testInfo.outputPath(exportedFile.suggestedFilename());
  await exportedFile.saveAs(exportedPath);

  await page.goto("/");
  await page.locator("textarea").nth(0).fill("这是一条被覆盖的内容。");
  await page.locator("textarea").nth(5).fill("这是一块新的石头。");
  await page.locator("button").first().click();

  await page.goto("/history");
  await page.locator('input[value="overwrite"]').check();
  await page.getByTestId("import-json-input").setInputFiles(exportedPath);

  await expect(page.getByTestId("import-preview")).toBeVisible();
  await expect(page.getByTestId("import-preview")).toContainText("总记录数：1");
  await expect(page.getByTestId("import-preview")).toContainText("将覆盖数：1");
  await expect(page.getByTestId("import-conflict-list")).toContainText(currentDate);
  await expect(page.getByTestId("import-conflict-list")).toContainText("将覆盖本地记录");

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByTestId("confirm-import-button").click();
  await expect(page.getByTestId("history-status-message")).toContainText("导入成功");

  await page.goto(`/records/${currentDate}`);
  await expect(page.locator("textarea").nth(0)).toHaveValue(originalAnswers[0]);
  await expect(page.locator("textarea").nth(5)).toHaveValue(originalAnswers[5]);
});

test("user can switch date from the visible date input", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("textarea")).toHaveCount(7);

  const targetDate = "2026-04-09";
  await page.locator('input[type="date"]').fill(targetDate);

  await expect(page).toHaveURL(new RegExp(`/records/${targetDate}$`));
  await expect(page.locator('input[type="date"]')).toHaveValue(targetDate);
});

test("user can clear all records and create a new one afterward", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("textarea")).toHaveCount(7);

  await page.locator("textarea").nth(0).fill("第一条记录");
  await page.locator("textarea").nth(5).fill("第一块石头");
  await page.locator("button").first().click();

  await page.goto("/history");
  await expect(page.locator("article")).toHaveCount(1);

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByTestId("clear-all-button").click();

  await expect(page.getByTestId("history-status-message")).toContainText("已清空本地记录");
  await expect(page.getByTestId("undo-clear-button")).toBeVisible();
  await expect(page.getByTestId("history-empty-state")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(0);

  await page.goto("/");
  await page.locator("textarea").nth(0).fill("清空后的新记录");
  await page.locator("textarea").nth(5).fill("新的主石头");
  await page.locator("button").first().click();

  await page.goto("/history");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText("新的主石头");
});
