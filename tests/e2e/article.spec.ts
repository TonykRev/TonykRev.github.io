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

test("article code blocks expose accessible copy feedback", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/research/dissecting-an-information-stealer/");
  const copy = page.getByRole("button", { name: "Copy code" });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(copy).toHaveText("Copied");
});

test("article ends with related research", async ({ page }) => {
  await page.goto("/research/dissecting-an-information-stealer/");
  await expect(page.getByRole("heading", { name: "Related research" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tracing an identity attack/i })).toBeVisible();
});

test("table of contents remains compact on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/research/dissecting-an-information-stealer/");

  const styles = await page.getByRole("navigation", { name: "On this page" }).evaluate((node) => {
    const computed = getComputedStyle(node);
    return { alignSelf: computed.alignSelf, position: computed.position };
  });

  expect(styles).toEqual({ alignSelf: "start", position: "sticky" });
});

test("table of contents precedes the article on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/research/dissecting-an-information-stealer/");

  const toc = page.getByRole("navigation", { name: "On this page" });
  const article = page.locator("[data-article-body]");
  const [tocBox, articleBox, tocStyles] = await Promise.all([
    toc.boundingBox(),
    article.boundingBox(),
    toc.evaluate((node) => {
      const computed = getComputedStyle(node);
      return { order: computed.order, position: computed.position };
    }),
  ]);

  expect(tocStyles).toEqual({ order: "-1", position: "static" });
  expect(tocBox?.y).toBeLessThan(articleBox?.y ?? Infinity);
});
