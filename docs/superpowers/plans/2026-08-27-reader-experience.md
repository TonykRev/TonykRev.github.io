# Reader Experience Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent dark-default/light theme, article reading progress, and global keyboard search without dependencies.

**Architecture:** Theme state is stored on `document.documentElement` using a pre-paint bootstrap plus a focused toggle component. Search remains a lazy client-side consumer of `/search-index.json` but moves into `BaseLayout`. Reading progress is an article-only component that observes `[data-article-body]` and batches updates with `requestAnimationFrame`.

**Tech Stack:** Astro static site, TypeScript browser scripts, CSS custom properties, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-27-reader-experience-design.md`

## Global Constraints

- Dark is first-render default; persist only an explicit reader choice in `localStorage`.
- Use system color preference only before a saved choice exists.
- Add no framework, animation library, remote search service, analytics, or account data.
- Retain navigation and article reading with JavaScript disabled.
- Preserve reduced-motion behavior and search failure feedback.

---

### Task 1: Persistent theme control

**Files:**
- Create: `src/components/ThemeToggle.astro`
- Modify: `src/layouts/BaseLayout.astro`, `src/styles/tokens.css`, `src/components/SiteHeader.astro`
- Test: `tests/e2e/theme.spec.ts`

**Interface:** Produces `[data-theme-toggle]` and root `data-theme="dark" | "light"`; consumes `localStorage["hsec-theme"]` values `dark` or `light`.

- [ ] **Step 1: Write the failing E2E test**

```ts
test("defaults to dark and persists a manual light selection", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:e2e -- tests/e2e/theme.spec.ts`

Expected: FAIL because no root theme attribute or theme control exists.

- [ ] **Step 3: Implement the pre-paint bootstrap and toggle**

```ts
const saved = localStorage.getItem("hsec-theme");
const theme = saved === "light" || saved === "dark" ? saved : "dark";
document.documentElement.dataset.theme = theme;
```

```ts
button.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("hsec-theme", next);
});
```

- [ ] **Step 4: Add theme token overrides, place control in the header, and verify GREEN**

```css
:root[data-theme="light"] { --color-bg: #f7fbfd; --color-surface: #ffffff; --color-line: #c6d4df; --color-text: #10202d; --color-muted: #536678; --color-accent: #006e9b; }
```

Run: `npm run test:e2e -- tests/e2e/theme.spec.ts && npm test && npm run check`

Expected: all commands exit 0.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/components/ThemeToggle.astro src/layouts/BaseLayout.astro src/styles/tokens.css src/components/SiteHeader.astro tests/e2e/theme.spec.ts
git commit -m "feat: add persistent theme control"
```

### Task 2: Global keyboard search

**Files:**
- Modify: `src/components/research/SearchOverlay.astro`, `src/layouts/BaseLayout.astro`, `src/pages/research/index.astro`, `src/components/SiteHeader.astro`
- Test: `tests/e2e/search.spec.ts`

**Interface:** Produces one `[data-search-dialog]` per page. It consumes static records `{ title, summary, domain, format, tags, url }` from `/search-index.json` and opens by header trigger, `Meta+K`, `Control+K`, or `/` outside editable controls.

- [ ] **Step 1: Write the failing global-search test**

```ts
test("opens global search with Control+K and shows result metadata", async ({ page }) => {
  await page.goto("/about/");
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Search research" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search research" }).fill("identity");
  await expect(page.getByText("cloud-security", { exact: true })).toBeVisible();
  await expect(page.getByText("case study", { exact: true })).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:e2e -- tests/e2e/search.spec.ts`

Expected: FAIL on `/about/` because search currently renders only on `/research/`.

- [ ] **Step 3: Move search to BaseLayout and add keyboard behavior**

```astro
<SiteHeader />
<SearchOverlay />
<main id="main"><slot /></main>
```

```ts
document.addEventListener("keydown", (event) => {
  const editable = event.target instanceof HTMLElement && event.target.matches("input, textarea, select, [contenteditable=true]");
  if (!editable && (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"))) {
    event.preventDefault();
    openSearch();
  }
  if (event.key === "Escape" && dialog?.open) dialog.close();
});
```

- [ ] **Step 4: Render title, domain/format, and summary; verify GREEN**

```ts
meta.textContent = `${record.domain.replaceAll("-", " ")} / ${record.format.replaceAll("-", " ")}`;
summary.textContent = record.summary;
```

Run: `npm run test:e2e -- tests/e2e/search.spec.ts && npm run test:e2e`

Expected: global shortcuts, error state, result navigation, and existing browser tests pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/research/SearchOverlay.astro src/layouts/BaseLayout.astro src/pages/research/index.astro src/components/SiteHeader.astro tests/e2e/search.spec.ts
git commit -m "feat: make research search global"
```

### Task 3: Article reading progress

**Files:**
- Create: `src/components/article/ReadingProgress.astro`
- Modify: `src/layouts/ResearchLayout.astro`, `src/styles/global.css`
- Test: `tests/e2e/article.spec.ts`

**Interface:** Produces `[data-reading-progress]` with `role="progressbar"`, `aria-valuenow`, and CSS `--reading-progress`; consumes the `[data-article-body]` element and renders only on article routes.

- [ ] **Step 1: Write the failing article-progress test**

```ts
test("shows article-only reading progress that advances while scrolling", async ({ page }) => {
  await page.goto("/research/dissecting-an-information-stealer/");
  const progress = page.getByRole("progressbar", { name: "Reading progress" });
  await expect(progress).toBeVisible();
  const initial = await progress.getAttribute("aria-valuenow");
  await page.locator("[data-article-body]").evaluate((node) => node.scrollIntoView({ block: "end" }));
  await expect.poll(() => progress.getAttribute("aria-valuenow")).not.toBe(initial);
  await page.goto("/about/");
  await expect(page.getByRole("progressbar", { name: "Reading progress" })).toHaveCount(0);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:e2e -- tests/e2e/article.spec.ts`

Expected: FAIL because no progressbar exists.

- [ ] **Step 3: Implement the frame-batched measurement**

```ts
const update = () => {
  frame = 0;
  const start = article.getBoundingClientRect().top + scrollY;
  const end = start + article.offsetHeight - innerHeight;
  const percent = Math.round(Math.min(100, Math.max(0, ((scrollY - start) / Math.max(1, end - start)) * 100)));
  bar.style.setProperty("--reading-progress", `${percent}%`);
  bar.setAttribute("aria-valuenow", String(percent));
};
const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule);
schedule();
```

- [ ] **Step 4: Mount only from ResearchLayout, style it, and verify GREEN**

```astro
<BaseLayout title={`${entry.data.title} | HSEC`} description={undefined}>
  <ReadingProgress />
```

```css
[data-reading-progress]::before { transform: scaleX(calc(var(--reading-progress) / 100)); transform-origin: left; }
@media (prefers-reduced-motion: reduce) { [data-reading-progress]::before { transition: none; } }
```

Run: `npm test && npm run check && SITE_URL=https://tonykrev.github.io npm run build && SITE_URL=https://tonykrev.github.io npm run test:built && npm run test:links && npm run test:e2e && npm run test:lighthouse`

Expected: all commands exit 0.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/article/ReadingProgress.astro src/layouts/ResearchLayout.astro src/styles/global.css tests/e2e/article.spec.ts
git commit -m "feat: add article reading progress"
```
