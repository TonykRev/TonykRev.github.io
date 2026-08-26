import { expect, test } from "@playwright/test";

test("research exposes format and tag metadata with progressive filters", async ({ page }) => {
  await page.goto("/research/");
  await expect(page.locator("[data-research-row]").getByText("case study", { exact: true })).toHaveCount(2);
  await expect(page.locator("[data-research-row]").getByText("identity", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Filter by identity" }).click();
  await expect(page.getByRole("link", { name: /Tracing an identity attack/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Dissecting an information stealer/i })).toBeHidden();

  await page.getByRole("button", { name: "Clear research filters" }).click();
  await expect(page.getByRole("link", { name: /Dissecting an information stealer/i })).toBeVisible();
});

test("domain pages retain the same filter controls", async ({ page }) => {
  await page.goto("/domains/malware-dfir/");
  await expect(page.getByRole("group", { name: "Filter research" })).toBeVisible();
});
