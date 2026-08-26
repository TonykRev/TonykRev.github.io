import { expect, test } from "@playwright/test";

test("first viewport focuses on featured research", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tracing an identity attack." })).toBeVisible();
  const index = await page.locator("#domain-index").boundingBox();
  expect(index?.y).toBeGreaterThanOrEqual(850);
});

test("domain index follows the hero and exposes exactly three domains", async ({ page }) => {
  await page.goto("/");
  await page.locator("#domain-index").scrollIntoViewIfNeeded();
  await expect(page.getByText("Explore the domains.")).toBeVisible();
  await expect(page.locator("[data-domain-row]")).toHaveCount(3);
  await expect(page.getByText("FILTER RESEARCH")).toBeVisible();
});
