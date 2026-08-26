import { expect, test } from "@playwright/test";

test("article header contains only approved metadata", async ({ page }) => {
  await page.goto("/research/dissecting-an-information-stealer/");
  const header = page.locator(".article-header");
  await expect(header.getByText("Published 25 Aug 2026")).toBeVisible();
  await expect(header.getByText(/Updated|minute read|Intermediate/i)).toHaveCount(0);
  await expect(header.getByText("Static and behavioral analysis of a Windows sample")).toHaveCount(0);
});

test("article exposes evidence, code, references, and table of contents", async ({ page }) => {
  await page.goto("/research/dissecting-an-information-stealer/");
  await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
  await expect(page.getByText("Evidence 01")).toBeVisible();
  await expect(page.locator("pre code")).toBeVisible();
  await expect(page.getByRole("heading", { name: "References" })).toBeVisible();
});
