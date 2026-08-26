import { expect, test } from "@playwright/test";

test("search is lazy and returns matching research", async ({ page }) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Search research" }).click();
  await page.getByRole("searchbox", { name: "Search research" }).fill("identity");
  await expect(page.locator("dialog").getByRole("link", { name: "Tracing an identity attack", exact: true })).toBeVisible();
});
