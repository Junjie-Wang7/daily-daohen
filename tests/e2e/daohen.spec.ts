import { expect, test } from "@playwright/test";

test.setTimeout(60000);

test("user can preview and confirm import before restoring a journal entry", async ({ page }, testInfo) => {
  await page.goto("/");

  const dateInput = page.locator('input[type="date"]');
  await expect(page.locator("textarea")).toHaveCount(7);
  const currentDate = await dateInput.inputValue();

  const originalAnswers = [
    "今天和同事讨论时起了一点波澜。",
    "我先想解释自己。",
    "其实我担心被误解。",
    "我害怕关系变得紧张。",
    "我告诉自己先冷静一下。",
    "主石头是先暂停，不急着回应。",
    "明天我会先确认事实再表达。",
  ];

  const textareas = page.locator("textarea");
  for (const [index, answer] of originalAnswers.entries()) {
    await textareas.nth(index).fill(answer);
  }

  await page.locator('input:not([type="date"])').first().fill("工作, 关系");
  await page.getByRole("button", { name: "立即留痕" }).click();

  await page.goto("/history");

  const exportDownload = page.waitForEvent("download");
  await page.getByTestId("export-json-button").click();
  const exportedFile = await exportDownload;
  const exportedPath = testInfo.outputPath(exportedFile.suggestedFilename());
  await exportedFile.saveAs(exportedPath);

  await page.goto("/");
  await page.locator("textarea").nth(0).fill("这是一条被覆盖的内容。");
  await page.locator("textarea").nth(5).fill("这是一块新的石头。");
  await page.getByRole("button", { name: "立即留痕" }).click();

  await page.goto("/history");
  await page.locator('input[value="overwrite"]').check();
  await page.getByTestId("import-json-input").setInputFiles(exportedPath);

  await expect(page.getByTestId("import-preview")).toBeVisible();
  await expect(page.getByTestId("import-preview")).toContainText("总记录数：");
  await expect(page.getByTestId("import-preview")).toContainText("将覆盖数：");
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
  await page.getByRole("button", { name: "立即留痕" }).click();

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
  await page.getByRole("button", { name: "立即留痕" }).click();

  await page.goto("/history");
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText("新的主石头");
});

test("user can open the calendar and navigate to a record day", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("textarea")).toHaveCount(7);

  const currentDate = await page.locator('input[type="date"]').inputValue();
  await page.locator("textarea").nth(0).fill("月历测试记录");
  await page.locator("textarea").nth(5).fill("月历主石头");
  await page.getByRole("button", { name: "立即留痕" }).click();

  await page.getByRole("link", { name: "月历" }).click();
  await expect(page).toHaveURL(/\/calendar$/);

  const todayCell = page.getByTestId(`calendar-day-${currentDate}`);
  await expect(todayCell).toBeVisible();
  await expect(todayCell).toHaveAttribute("aria-current", "date");
  await expect(page.getByTestId("streak-detail")).toBeVisible();

  await todayCell.click();
  await expect(page.getByTestId("calendar-preview")).toBeVisible();
  const readableDate = currentDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1 年 $2 月 $3 日");
  await expect(page.getByTestId("calendar-preview")).toContainText(readableDate);
  await expect(page.getByTestId("calendar-preview")).toContainText("月历测试记录");

  await page.getByRole("link", { name: "查看当天详情" }).click();
  await expect(page).toHaveURL(new RegExp(`/records/${currentDate}$`));
  await expect(page.locator("textarea").nth(0)).toHaveValue("月历测试记录");
});

test("user can preview an empty calendar day before opening its record page", async ({ page }) => {
  await page.goto("/");
  const currentDate = await page.locator('input[type="date"]').inputValue();

  const emptyDate = (() => {
    const date = new Date(`${currentDate}T00:00:00`);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  await page.locator("textarea").nth(0).fill("月历空状态测试");
  await page.locator("textarea").nth(5).fill("月历空状态主石头");
  await page.getByRole("button", { name: "立即留痕" }).click();

  await page.getByRole("link", { name: "月历" }).click();
  const emptyCell = page.getByTestId(`calendar-day-${emptyDate}`);
  await expect(emptyCell).toBeVisible();
  await emptyCell.click();

  await expect(page.getByTestId("calendar-preview")).toContainText("这一天还没有留下道痕");
  await expect(page.getByRole("link", { name: /前往当天记录页|去写今天/ })).toBeVisible();

  await page.getByRole("button", { name: "关闭预览" }).click();
  await expect(page.getByTestId("calendar-preview")).toContainText("先点开某一天");
});

test("user can filter review entries by keyword, tag and stone, then clear the filter", async ({ page }) => {
  await page.goto("/");
  const currentDate = await page.locator('input[type="date"]').inputValue();

  const shiftDate = (dateString: string, offsetDays: number) => {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const records = [
    {
      date: currentDate,
      title: "回顾主石头一",
      stone: "先暂停",
      tags: "工作, 复盘",
      event: "我先想解释自己。",
      thought: "其实我担心被误解。",
      fear: "我害怕关系变得紧张。",
    },
    {
      date: shiftDate(currentDate, -2),
      title: "回顾主石头二",
      stone: "先暂停",
      tags: "工作",
      event: "我先整理事实。",
      thought: "先确认事实。",
      fear: "我在等一个更清楚的说法。",
    },
    {
      date: shiftDate(currentDate, -4),
      title: "回顾主石头三",
      stone: "先观察",
      tags: "工作",
      event: "先确认事实。",
      thought: "关系变得紧张。",
      fear: "我先梳理思路。",
    },
  ];

  for (const record of records) {
    await page.goto(`/records/${record.date}`);
    await page.locator("textarea").nth(0).fill(record.event);
    await page.locator("textarea").nth(2).fill(record.thought);
    await page.locator("textarea").nth(3).fill(record.fear);
    await page.locator("textarea").nth(5).fill(record.stone);
    await page.locator('input:not([type="date"])').first().fill(record.tags);
    await page.getByRole("button", { name: "立即留痕" }).click();
  }

  await page.getByRole("link", { name: "回顾" }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByTestId("review-range-7d")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("review-list").locator("a")).toHaveCount(3);

  await page.getByTestId("review-keyword-filter-0").click();
  await expect(page.getByTestId("review-keyword-filter-0")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("review-list").locator("a")).toHaveCount(2);

  await page.getByTestId("review-clear-filter").click();
  await expect(page.getByTestId("review-list").locator("a")).toHaveCount(3);

  await page.getByTestId("review-tag-filter-0").click();
  await expect(page.getByTestId("review-list").locator("a")).toHaveCount(3);

  await page.getByTestId("review-stone-filter-1").click();
  await expect(page.getByTestId("review-list").locator("a")).toHaveCount(1);

  await page.getByTestId("review-clear-filter").click();
  await page.getByTestId("review-range-30d").click();
  await expect(page.getByTestId("review-list").locator("a")).toHaveCount(3);

  await page.getByTestId(`review-item-${currentDate}`).click();
  await expect(page).toHaveURL(new RegExp(`/records/${currentDate}$`));
  await expect(page.locator("textarea").nth(0)).toHaveValue("我先想解释自己。");
});

test("user sees a friendly empty state when the current review range has no records", async ({ page }) => {
  await page.goto("/");
  const currentDate = await page.locator('input[type="date"]').inputValue();

  const oldDate = (() => {
    const date = new Date(`${currentDate}T00:00:00`);
    date.setDate(date.getDate() - 40);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  await page.goto(`/records/${oldDate}`);
  await page.locator("textarea").nth(0).fill("四十天前的记录");
  await page.locator("textarea").nth(5).fill("旧主石头");
  await page.getByRole("button", { name: "立即留痕" }).click();

  await page.getByRole("link", { name: "回顾" }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByTestId("review-empty-state")).toContainText("最近 7 天还没有留下痕迹");

  await page.getByTestId("review-range-30d").click();
  await expect(page.getByTestId("review-empty-state")).toContainText("最近 30 天还没有留下痕迹");
});

test("user sees a gentle loading state before today's editor appears", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("page-loading-state")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(7);
});

test("user can open and close the lightweight introduction on the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("home-intro-toggle")).toBeVisible();

  await page.getByTestId("home-intro-toggle").click();
  await expect(page.getByTestId("home-intro-panel")).toBeVisible();
  await expect(page.getByTestId("home-intro-panel")).toContainText("道痕，是事情经过你之后");

  await page.getByTestId("home-intro-close").click();
  await expect(page.getByTestId("home-intro-toggle")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(7);
});

test("user can switch to dark mode and keep it after refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("theme-toggle")).toBeVisible();

  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.goto("/calendar");
  await expect(page.getByTestId("calendar-preview")).toBeVisible();

  await page.goto("/review");
  await expect(page.getByTestId("review-range-7d")).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("user input is automatically saved and restored after refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("textarea")).toHaveCount(7);

  await page.locator("textarea").nth(0).fill("自动草稿测试");
  await page.locator("textarea").nth(5).fill("自动保存主石头");
  await page.locator('input:not([type="date"])').first().fill("工作");

  await expect(page.getByTestId("autosave-status")).toContainText("已自动保存");

  await page.reload();
  await expect(page.locator("textarea").nth(0)).toHaveValue("自动草稿测试");
  await expect(page.locator("textarea").nth(5)).toHaveValue("自动保存主石头");
});

test("mobile editor keeps the main controls easy to reach", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("textarea")).toHaveCount(7);

  const dateInput = page.locator('input[type="date"]');
  const saveButton = page.getByRole("button", { name: "立即留痕" });

  await expect(dateInput).toBeVisible();
  await expect(saveButton).toBeVisible();

  const dateBox = await dateInput.boundingBox();
  const saveBox = await saveButton.boundingBox();

  expect(dateBox?.width ?? 0).toBeGreaterThan(280);
  expect(saveBox?.height ?? 0).toBeGreaterThan(40);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

