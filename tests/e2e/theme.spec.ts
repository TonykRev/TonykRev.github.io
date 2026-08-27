import { expect, test } from "@playwright/test";

test("defaults to dark and persists a manual light selection", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const toggle = page.locator("[data-theme-toggle]");
  await expect(toggle).toHaveAccessibleName("Switch to light theme");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
