import { expect, test } from "@playwright/test";

test("global navigation is keyboard accessible", async ({ page }) => {
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Tab");

  await expect(skipLink).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects/");
});

test("global footer exposes the RSS feed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("contentinfo").getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/rss.xml");
});

test("reduced motion disables decorative animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const animation = await page
    .locator("[data-signal-ring]")
    .evaluate((node) => getComputedStyle(node).animationName);

  expect(animation).toBe("none");
});
