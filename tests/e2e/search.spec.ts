import { expect, test } from "@playwright/test";

test("search is lazy and returns matching research", async ({ page }) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Search research" }).click();
  await page.getByRole("searchbox", { name: "Search research" }).fill("identity");
  await expect(page.locator("dialog a").filter({ hasText: "Tracing an identity attack" })).toBeVisible();
});

test("search reports a failed index request", async ({ page }) => {
  await page.route("**/search-index.json", (route) => route.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
  await page.goto("/research/");
  await page.getByRole("button", { name: "Search research" }).click();

  await expect(page.getByRole("status")).toHaveText("Search is unavailable. Please try again.");
});

test("global search opens with Control+K, presents metadata, and closes with Escape", async ({ page }) => {
  await page.goto("/about/");
  await page.keyboard.press("Control+K");

  const dialog = page.getByRole("dialog", { name: "Search research" });
  await expect(dialog).toBeVisible();
  await page.getByRole("searchbox", { name: "Search research" }).fill("identity");
  await expect(dialog.getByText("cloud security / case study", { exact: true })).toBeVisible();
  await expect(dialog.getByText("A forensic reconstruction across cloud identity and endpoint telemetry.", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
