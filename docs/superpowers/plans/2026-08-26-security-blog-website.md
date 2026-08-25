# Security Blog Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved English-language personal security research blog as a fast, accessible Astro static site deployed to `username.github.io`.

**Architecture:** Astro Content Collections validate Markdown/MDX research at build time. Astro renders static HTML, CSS, a small lazy-loaded search module, RSS, sitemap, and GitHub Pages artifacts; no runtime server, database, CMS, or paid service is required.

**Tech Stack:** Astro, TypeScript, Markdown/MDX, CSS, Vitest, Playwright, axe-core, Linkinator, Lighthouse CI, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-26-personal-security-blog-design.md`

## Global Constraints

- UI and published content are English.
- Domains are exactly `malware-dfir`, `cloud-security`, and `security-engineering`.
- Formats are exactly `deep-research`, `case-study`, and `guide`.
- Homepage first viewport contains one featured research story; the domain index appears only after scrolling.
- Visual direction is Editorial Signal: near-black background, cold-blue accent, asymmetric editorial layout, thin grid lines, restrained monospace labels.
- Essential content and navigation work without client JavaScript.
- Decorative motion uses only `transform` and `opacity`, and is disabled by `prefers-reduced-motion: reduce`.
- Article header contains breadcrumb, title, and published date only; no dek, updated date, reading time, or difficulty.
- No live malware, direct executable downloads, secrets, tenant identifiers, personal data, paid CMS, database, analytics, or paid search service.
- Public-repository drafts are not confidential; sensitive drafts remain local and untracked.
- Validation or build failure must block deployment and preserve the currently published site.

---

## File Map

```text
.
├── .github/workflows/
│   ├── ci.yml                         # test/check/build/links/a11y gate
│   └── deploy.yml                     # GitHub Pages deployment
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── scripts/
│   └── assert-built-site.mjs          # static-output and artifact assertions
├── src/
│   ├── components/
│   │   ├── article/
│   │   │   ├── ArticleHeader.astro
│   │   │   ├── ArticleBody.astro
│   │   │   ├── EvidenceBlock.astro
│   │   │   └── TableOfContents.astro
│   │   ├── home/
│   │   │   ├── DomainIndex.astro
│   │   │   ├── FeaturedHero.astro
│   │   │   └── SignalRing.astro
│   │   ├── research/
│   │   │   ├── ResearchList.astro
│   │   │   └── SearchOverlay.astro
│   │   ├── projects/
│   │   │   └── ProjectPreview.astro
│   │   └── SiteHeader.astro
│   ├── content/research/
│   │   ├── tracing-an-identity-attack.md
│   │   └── dissecting-an-information-stealer.mdx
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ResearchLayout.astro
│   ├── lib/
│   │   ├── content-model.ts
│   │   ├── research.ts
│   │   └── search-index.ts
│   ├── pages/
│   │   ├── domains/[domain].astro
│   │   ├── research/[...id].astro
│   │   ├── research/index.astro
│   │   ├── 404.astro
│   │   ├── about.astro
│   │   ├── index.astro
│   │   ├── projects.astro
│   │   ├── rss.xml.ts
│   │   └── search-index.json.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── motion.css
│   │   ├── prose.css
│   │   └── tokens.css
│   ├── content.config.ts
│   └── site.config.ts
├── tests/
│   ├── e2e/
│   │   ├── accessibility.spec.ts
│   │   ├── article.spec.ts
│   │   ├── homepage.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── search.spec.ts
│   └── unit/
│       ├── content-model.test.ts
│       ├── research.test.ts
│       └── search-index.test.ts
├── astro.config.mjs
├── lighthouserc.cjs
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Core Interfaces

```ts
export const DOMAINS = [
  "malware-dfir",
  "cloud-security",
  "security-engineering",
] as const;

export const FORMATS = [
  "deep-research",
  "case-study",
  "guide",
] as const;

export type Domain = (typeof DOMAINS)[number];
export type ResearchFormat = (typeof FORMATS)[number];

export interface ResearchSummary {
  id: string;
  title: string;
  published: Date;
  domain: Domain;
  format: ResearchFormat;
  summary: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
}

export interface SearchRecord {
  id: string;
  title: string;
  summary: string;
  domain: Domain;
  format: ResearchFormat;
  tags: string[];
  url: string;
}
```

### Task 1: Astro Foundation and Test Harness

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/site.config.ts`
- Create: `src/pages/index.astro`
- Create: `tests/unit/content-model.test.ts`

**Interfaces:**
- Consumes: approved spec only.
- Produces: `SITE`, npm scripts, Astro dev/build commands, Vitest and Playwright runners used by every later task.

- [ ] **Step 1: Scaffold the minimal Astro project and install only approved dependencies**

```bash
npm create astro@latest . -- --template minimal --typescript strict --install false --git false
npm install astro @astrojs/check @astrojs/mdx @astrojs/rss @astrojs/sitemap typescript
npm install --save-dev vitest @playwright/test @axe-core/playwright linkinator @lhci/cli
npx playwright install chromium
```

Preserve `docs/`, `.gitignore`, and the existing Git history if the scaffold command asks about conflicts.

- [ ] **Step 2: Add exact quality scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "build": "astro build",
    "test:links": "linkinator dist --recurse --skip 'mailto:'",
    "test:built": "node scripts/assert-built-site.mjs",
    "test:lighthouse": "lhci autorun"
  }
}
```

- [ ] **Step 3: Write the failing site-config test**

```ts
// tests/unit/content-model.test.ts
import { describe, expect, it } from "vitest";
import { SITE } from "../../src/site.config";

describe("SITE", () => {
  it("uses the approved English identity", () => {
    expect(SITE.language).toBe("en");
    expect(SITE.title).toBe("HSEC");
    expect(SITE.description).toContain("security research");
  });
});
```

- [ ] **Step 4: Run the test and verify the intended failure**

Run: `npm test -- tests/unit/content-model.test.ts`  
Expected: FAIL because `src/site.config.ts` does not exist.

- [ ] **Step 5: Add the minimal site configuration and static Astro setup**

```ts
// src/site.config.ts
export const SITE = {
  title: "HSEC",
  description: "Independent security research for modern defenders.",
  language: "en",
} as const;
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  output: "static",
  integrations: [mdx(), sitemap()],
});
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://127.0.0.1:4321", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 6: Run the foundation checks**

Run: `npm test -- tests/unit/content-model.test.ts && npm run check && npm run build`  
Expected: all commands exit 0 and `dist/index.html` exists.

- [ ] **Step 7: Commit the foundation**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts src/site.config.ts src/pages/index.astro tests/unit/content-model.test.ts
git commit -m "build: scaffold Astro blog foundation"
```

### Task 2: Validated Research Content Model

**Files:**
- Create: `src/lib/content-model.ts`
- Create: `src/content.config.ts`
- Create: `src/lib/research.ts`
- Create: `src/content/research/tracing-an-identity-attack.md`
- Create: `tests/unit/research.test.ts`

**Interfaces:**
- Consumes: Astro Content Collections from Task 1.
- Produces: `DOMAINS`, `FORMATS`, `ResearchSummary`, `visibleResearch()`, `featuredResearch()`, and `researchByDomain()`.

- [ ] **Step 1: Write failing research helper tests**

```ts
// tests/unit/research.test.ts
import { describe, expect, it } from "vitest";
import { featuredResearch, researchByDomain, visibleResearch } from "../../src/lib/research";
import type { ResearchSummary } from "../../src/lib/content-model";

const entry = (overrides: Partial<ResearchSummary> = {}): ResearchSummary => ({
  id: "sample",
  title: "Sample",
  published: new Date("2026-08-25T00:00:00Z"),
  domain: "cloud-security",
  format: "case-study",
  summary: "Evidence-led sample.",
  tags: ["identity"],
  draft: false,
  featured: false,
  ...overrides,
});

describe("research helpers", () => {
  it("removes drafts and sorts newest first", () => {
    const rows = visibleResearch([
      entry({ id: "old", published: new Date("2026-01-01") }),
      entry({ id: "draft", draft: true, published: new Date("2027-01-01") }),
      entry({ id: "new", published: new Date("2026-08-25") }),
    ]);
    expect(rows.map((row) => row.id)).toEqual(["new", "old"]);
  });

  it("requires exactly one visible featured entry", () => {
    expect(() => featuredResearch([entry()])).toThrow("exactly one featured research entry");
    expect(featuredResearch([entry({ featured: true })]).id).toBe("sample");
  });

  it("filters by approved domain", () => {
    expect(researchByDomain([entry()], "cloud-security")).toHaveLength(1);
    expect(researchByDomain([entry()], "malware-dfir")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm test -- tests/unit/research.test.ts`  
Expected: FAIL because content model and helpers do not exist.

- [ ] **Step 3: Define exact types and helpers**

```ts
// src/lib/content-model.ts
export const DOMAINS = ["malware-dfir", "cloud-security", "security-engineering"] as const;
export const FORMATS = ["deep-research", "case-study", "guide"] as const;
export type Domain = (typeof DOMAINS)[number];
export type ResearchFormat = (typeof FORMATS)[number];

export interface ResearchSummary {
  id: string;
  title: string;
  published: Date;
  domain: Domain;
  format: ResearchFormat;
  summary: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
}
```

```ts
// src/lib/research.ts
import type { Domain, ResearchSummary } from "./content-model";

export function visibleResearch(entries: ResearchSummary[]): ResearchSummary[] {
  return entries.filter((entry) => !entry.draft).sort((a, b) => b.published.getTime() - a.published.getTime());
}

export function featuredResearch(entries: ResearchSummary[]): ResearchSummary {
  const featured = visibleResearch(entries).filter((entry) => entry.featured);
  if (featured.length !== 1) throw new Error("Expected exactly one featured research entry");
  return featured[0];
}

export function researchByDomain(entries: ResearchSummary[], domain: Domain): ResearchSummary[] {
  return visibleResearch(entries).filter((entry) => entry.domain === domain);
}

export function assertUniqueResearchIds(entries: ResearchSummary[]): void {
  const normalized = entries.map((entry) => entry.id.toLocaleLowerCase("en"));
  if (new Set(normalized).size !== normalized.length) throw new Error("Research IDs must be unique ignoring case");
}
```

Add this test to `tests/unit/research.test.ts`:

```ts
it("rejects case-insensitive research ID collisions", () => {
  expect(() => assertUniqueResearchIds([
    entry({ id: "Sample" }),
    entry({ id: "sample" }),
  ])).toThrow("unique ignoring case");
});
```

Import `assertUniqueResearchIds` beside the other helpers. Call the assertion once after mapping each collection in homepage, index, domain, search-index, RSS, and dynamic-route generation code so a case-insensitive URL collision blocks build:

```ts
const entries = collection.map(({ id, data }) => ({ id, ...data }));
assertUniqueResearchIds(entries);
```

- [ ] **Step 4: Add the Astro collection schema**

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { DOMAINS, FORMATS } from "./lib/content-model";

const research = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/research" }),
  schema: z.object({
    title: z.string().min(1),
    published: z.coerce.date(),
    domain: z.enum(DOMAINS),
    format: z.enum(FORMATS),
    summary: z.string().min(1).max(240),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { research };
```

- [ ] **Step 5: Add one safe featured fixture**

```md
---
title: "Tracing an identity attack"
published: 2026-08-25
domain: "cloud-security"
format: "case-study"
summary: "A forensic reconstruction across cloud identity and endpoint telemetry."
tags: ["identity", "detection"]
draft: false
featured: true
---

## Executive summary

This safe fixture validates the publishing system. It contains no tenant data or live indicators.
```

- [ ] **Step 6: Run model tests and build validation**

Run: `npm test -- tests/unit/research.test.ts && npm run check && npm run build`  
Expected: PASS; invalid enum values would fail `astro check` or build.

- [ ] **Step 7: Commit the content model**

```bash
git add src/content.config.ts src/content/research/tracing-an-identity-attack.md src/lib/content-model.ts src/lib/research.ts tests/unit/research.test.ts
git commit -m "feat: add validated research content model"
```

### Task 3: Editorial Signal Design Foundation

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/motion.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/home/SignalRing.astro`
- Create: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `SITE` from Task 1.
- Produces: `BaseLayout`, `SiteHeader`, CSS tokens, and `.signal-ring` / `.blink-cursor` motion primitives.

- [ ] **Step 1: Write failing navigation and reduced-motion tests**

```ts
// tests/e2e/navigation.spec.ts
import { expect, test } from "@playwright/test";

test("global navigation is keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test("reduced motion disables decorative animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const animation = await page.locator("[data-signal-ring]").evaluate((node) => getComputedStyle(node).animationName);
  expect(animation).toBe("none");
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm run test:e2e -- tests/e2e/navigation.spec.ts`  
Expected: FAIL because the accessible shell and signal ring are absent.

- [ ] **Step 3: Add tokens and global typography/layout rules**

```css
/* src/styles/tokens.css */
:root {
  --color-bg: #090e14;
  --color-surface: #0d151d;
  --color-line: #293747;
  --color-text: #edf6fc;
  --color-muted: #8293a6;
  --color-accent: #76d9ff;
  --content-width: 74rem;
  --reading-width: 44rem;
}
```

```css
/* src/styles/motion.css */
@keyframes signal-breathe { 50% { transform: scale(1.035); opacity: .65; } }
@keyframes cursor-blink { 50% { opacity: 0; } }
.signal-ring { animation: signal-breathe 6s ease-in-out infinite; }
.blink-cursor { animation: cursor-blink 1.15s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .signal-ring, .blink-cursor { animation: none; }
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Implement `BaseLayout`, `SiteHeader`, and `SignalRing`**

```astro
---
// src/layouts/BaseLayout.astro
import { SITE } from "../site.config";
import SiteHeader from "../components/SiteHeader.astro";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/motion.css";
interface Props { title?: string; description?: string; }
const { title = SITE.title, description = SITE.description } = Astro.props;
---
<!doctype html>
<html lang={SITE.language}>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><meta name="description" content={description} /><title>{title}</title></head>
  <body><a class="skip-link" href="#main">Skip to content</a><SiteHeader /><main id="main"><slot /></main></body>
</html>
```

```astro
<!-- src/components/home/SignalRing.astro -->
<div class="signal-ring" data-signal-ring aria-hidden="true"><span></span><span></span></div>
```

Render `<SignalRing />` once in the temporary `src/pages/index.astro` shell so the reduced-motion test exercises a real mounted element. Task 4 moves the same component into `FeaturedHero`.

- [ ] **Step 5: Run shell tests and checks**

Run: `npm run test:e2e -- tests/e2e/navigation.spec.ts && npm run check && npm run build`  
Expected: PASS.

- [ ] **Step 6: Commit the design foundation**

```bash
git add src/styles src/layouts/BaseLayout.astro src/components/SiteHeader.astro src/components/home/SignalRing.astro src/pages/index.astro tests/e2e/navigation.spec.ts
git commit -m "feat: add Editorial Signal site foundation"
```

### Task 4: Hero-First Homepage and Domain Index

**Files:**
- Create: `src/components/home/FeaturedHero.astro`
- Create: `src/components/home/DomainIndex.astro`
- Modify: `src/pages/index.astro`
- Create: `tests/e2e/homepage.spec.ts`

**Interfaces:**
- Consumes: `featuredResearch()`, `DOMAINS`, `BaseLayout`, `SignalRing`.
- Produces: hero-first homepage with `#domain-index` below the first viewport.

- [ ] **Step 1: Write failing homepage flow tests**

```ts
// tests/e2e/homepage.spec.ts
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
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm run test:e2e -- tests/e2e/homepage.spec.ts`  
Expected: FAIL because homepage components are absent.

- [ ] **Step 3: Implement `FeaturedHero` using one content entry**

```astro
---
// src/components/home/FeaturedHero.astro
import SignalRing from "./SignalRing.astro";
import type { ResearchSummary } from "../../lib/content-model";
interface Props { entry: ResearchSummary; }
const { entry } = Astro.props;
---
<section class="featured-hero" aria-labelledby="featured-title">
  <SignalRing />
  <p class="technical-label">Featured investigation</p>
  <h1 id="featured-title">{entry.title}.</h1>
  <a href={`/research/${entry.id}/`}>Read featured research <span aria-hidden="true">↗</span></a>
  <a class="scroll-cue" href="#domain-index">Scroll to explore</a>
</section>
```

- [ ] **Step 4: Implement `DomainIndex` and the blinking filter cursor**

```astro
---
// src/components/home/DomainIndex.astro
const domains = [
  ["01", "Malware & DFIR", "malware-dfir"],
  ["02", "Cloud Security", "cloud-security"],
  ["03", "Security Engineering", "security-engineering"],
] as const;
---
<section id="domain-index" aria-labelledby="domain-title">
  <p class="technical-label">02 / Research index</p>
  <h2 id="domain-title">Explore the domains.</h2>
  <p class="filter-label">FILTER RESEARCH <span class="blink-cursor" aria-hidden="true"></span></p>
  <div>{domains.map(([number, label, slug]) => <a data-domain-row href={`/domains/${slug}/`}><span>{number}</span><strong>{label}</strong><span aria-hidden="true">↗</span></a>)}</div>
</section>
```

- [ ] **Step 5: Query the collection once in `index.astro` and assemble the page**

```astro
---
// src/pages/index.astro
import { getCollection } from "astro:content";
import FeaturedHero from "../components/home/FeaturedHero.astro";
import DomainIndex from "../components/home/DomainIndex.astro";
import BaseLayout from "../layouts/BaseLayout.astro";
import { featuredResearch, visibleResearch } from "../lib/research";

const collection = await getCollection("research");
const entries = collection.map(({ id, data }) => ({ id, ...data }));
const featured = featuredResearch(entries);
const recent = visibleResearch(entries).filter((entry) => entry.id !== featured.id).slice(0, 3);
---
<BaseLayout>
  <FeaturedHero entry={featured} />
  <DomainIndex />
  <section id="recent-work" aria-label="Recent work">{recent.map((entry) => <a href={`/research/${entry.id}/`}>{entry.title}</a>)}</section>
  <section id="selected-projects" aria-label="Selected projects"></section>
  <section id="profile" aria-label="Profile"></section>
</BaseLayout>
```

- [ ] **Step 6: Run homepage tests, check, and build**

Run: `npm run test:e2e -- tests/e2e/homepage.spec.ts && npm run check && npm run build`  
Expected: PASS.

- [ ] **Step 7: Commit the homepage**

```bash
git add src/components/home/FeaturedHero.astro src/components/home/DomainIndex.astro src/pages/index.astro tests/e2e/homepage.spec.ts
git commit -m "feat: build hero-first research homepage"
```

### Task 5: Research Index, Domain Routes, and Static Search

**Files:**
- Create: `src/lib/search-index.ts`
- Create: `src/components/research/ResearchList.astro`
- Create: `src/components/research/SearchOverlay.astro`
- Create: `src/pages/research/index.astro`
- Create: `src/pages/domains/[domain].astro`
- Create: `src/pages/search-index.json.ts`
- Create: `tests/unit/search-index.test.ts`
- Create: `tests/e2e/search.spec.ts`

**Interfaces:**
- Consumes: `ResearchSummary`, `DOMAINS`, `visibleResearch()`, `researchByDomain()`.
- Produces: `buildSearchIndex(entries): SearchRecord[]`, static JSON search endpoint, research/domain pages, lazy search overlay.

- [ ] **Step 1: Write failing search-index unit tests**

```ts
// tests/unit/search-index.test.ts
import { describe, expect, it } from "vitest";
import { buildSearchIndex } from "../../src/lib/search-index";

describe("buildSearchIndex", () => {
  it("excludes drafts and emits stable research URLs", () => {
    const rows = buildSearchIndex([
      { id: "visible", title: "Visible", published: new Date(), domain: "cloud-security", format: "guide", summary: "Visible guide", tags: ["iam"], draft: false, featured: false },
      { id: "secret", title: "Secret", published: new Date(), domain: "cloud-security", format: "guide", summary: "Draft", tags: [], draft: true, featured: false },
    ]);
    expect(rows).toEqual([{ id: "visible", title: "Visible", summary: "Visible guide", domain: "cloud-security", format: "guide", tags: ["iam"], url: "/research/visible/" }]);
  });
});
```

- [ ] **Step 2: Run the unit test and verify failure**

Run: `npm test -- tests/unit/search-index.test.ts`  
Expected: FAIL because `buildSearchIndex` does not exist.

- [ ] **Step 3: Implement the pure static-index builder**

```ts
// src/lib/search-index.ts
import type { ResearchSummary, SearchRecord } from "./content-model";
import { visibleResearch } from "./research";

export function buildSearchIndex(entries: ResearchSummary[]): SearchRecord[] {
  return visibleResearch(entries).map(({ id, title, summary, domain, format, tags }) => ({
    id, title, summary, domain, format, tags, url: `/research/${id}/`,
  }));
}
```

Add `SearchRecord` exactly as defined in Core Interfaces to `src/lib/content-model.ts`.

- [ ] **Step 4: Generate `search-index.json` at build time**

```ts
// src/pages/search-index.json.ts
import { getCollection } from "astro:content";
import { buildSearchIndex } from "../lib/search-index";

export async function GET() {
  const entries = await getCollection("research");
  const records = buildSearchIndex(entries.map(({ id, data }) => ({ id, ...data })));
  return new Response(JSON.stringify(records), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
```

- [ ] **Step 5: Build index pages and lazy client search**

```astro
---
// src/components/research/ResearchList.astro
import type { ResearchSummary } from "../../lib/content-model";
interface Props { entries: ResearchSummary[]; }
const { entries } = Astro.props;
---
<ol class="research-list">
  {entries.map((entry) => <li><a href={`/research/${entry.id}/`}><strong>{entry.title}</strong><span>{entry.summary}</span><time datetime={entry.published.toISOString()}>{entry.published.toLocaleDateString("en-GB")}</time></a></li>)}
</ol>
```

```astro
<!-- src/components/research/SearchOverlay.astro -->
<button type="button" data-search-open>Search research</button>
<dialog data-search-dialog aria-label="Search research">
  <form method="dialog"><button aria-label="Close search">Close</button></form>
  <label>Search research <input type="search" aria-label="Search research" data-search-input /></label>
  <ul data-search-results></ul>
</dialog>
<script>
  const button = document.querySelector<HTMLButtonElement>("[data-search-open]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]");
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const list = document.querySelector<HTMLUListElement>("[data-search-results]");
  let records: Array<{ title: string; summary: string; domain: string; format: string; tags: string[]; url: string }> | undefined;
  button?.addEventListener("click", async () => {
    records ??= await fetch("/search-index.json").then((response) => response.json());
    dialog?.showModal();
    input?.focus();
  });
  input?.addEventListener("input", () => {
    if (!list || !records) return;
    list.replaceChildren();
    const query = input.value.toLocaleLowerCase("en").trim();
    for (const record of records.filter((item) => [item.title, item.summary, item.domain, item.format, ...item.tags].join(" ").toLocaleLowerCase("en").includes(query)).slice(0, 10)) {
      const anchor = document.createElement("a");
      anchor.href = record.url;
      anchor.textContent = record.title;
      const item = document.createElement("li");
      item.append(anchor);
      list.append(item);
    }
  });
</script>
```

`research/index.astro` loads visible entries and renders `SearchOverlay` plus `ResearchList`. `domains/[domain].astro` exports one static path per value in `DOMAINS`, calls `researchByDomain()`, and renders the same list component.

- [ ] **Step 6: Write and run the browser search test**

```ts
// tests/e2e/search.spec.ts
import { expect, test } from "@playwright/test";

test("search is lazy and returns matching research", async ({ page }) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Search research" }).click();
  await page.getByRole("searchbox", { name: "Search research" }).fill("identity");
  await expect(page.getByRole("link", { name: /Tracing an identity attack/i })).toBeVisible();
});
```

Run: `npm test -- tests/unit/search-index.test.ts && npm run test:e2e -- tests/e2e/search.spec.ts && npm run build`  
Expected: PASS and `dist/search-index.json` exists.

- [ ] **Step 7: Commit research discovery**

```bash
git add src/lib src/components/research src/pages/research src/pages/domains src/pages/search-index.json.ts tests/unit/search-index.test.ts tests/e2e/search.spec.ts
git commit -m "feat: add research discovery and static search"
```

### Task 6: Evidence-First Research Reading System

**Files:**
- Create: `src/styles/prose.css`
- Create: `src/components/article/ArticleHeader.astro`
- Create: `src/components/article/ArticleBody.astro`
- Create: `src/components/article/TableOfContents.astro`
- Create: `src/components/article/EvidenceBlock.astro`
- Create: `src/layouts/ResearchLayout.astro`
- Create: `src/pages/research/[...id].astro`
- Create: `src/content/research/dissecting-an-information-stealer.mdx`
- Create: `tests/e2e/article.spec.ts`

**Interfaces:**
- Consumes: Astro `render(entry)` output `{ Content, headings }`, `BaseLayout`, and validated collection entries.
- Produces: research routes, simplified article header, reusable evidence block, responsive TOC, readable prose styles.

- [ ] **Step 1: Write failing article contract tests**

```ts
// tests/e2e/article.spec.ts
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
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:e2e -- tests/e2e/article.spec.ts`  
Expected: FAIL because the article route and components do not exist.

- [ ] **Step 3: Implement the simplified article header**

```astro
---
// src/components/article/ArticleHeader.astro
import type { Domain, ResearchFormat } from "../../lib/content-model";
interface Props { title: string; published: Date; domain: Domain; format: ResearchFormat; entryNumber: string; }
const { title, published, domain, format, entryNumber } = Astro.props;
const publishedLabel = published.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
---
<header class="article-header">
  <p class="technical-label">{domain} / {format} / {entryNumber}</p>
  <h1>{title}</h1>
  <p class="published">Published {publishedLabel}</p>
</header>
```

- [ ] **Step 4: Implement TOC, evidence, layout, and dynamic routes**

```astro
---
// src/components/article/TableOfContents.astro
interface Heading { depth: number; slug: string; text: string; }
interface Props { headings: Heading[]; }
const { headings } = Astro.props;
const visible = headings.filter((heading) => heading.depth === 2 || heading.depth === 3);
---
<nav aria-label="On this page"><p>On this page</p>{visible.map((heading) => <a href={`#${heading.slug}`} data-depth={heading.depth}>{heading.text}</a>)}</nav>
```

```astro
---
// src/components/article/EvidenceBlock.astro
interface Props { id: string; status: "Verified" | "Inferred" | "External"; }
const { id, status } = Astro.props;
---
<aside class="evidence-block"><header><span>{id}</span><span>{status}</span></header><div><slot /></div></aside>
```

```astro
---
// src/pages/research/[...id].astro
import { getCollection, render } from "astro:content";
import ResearchLayout from "../../layouts/ResearchLayout.astro";
export async function getStaticPaths() {
  const entries = await getCollection("research", ({ data }) => !data.draft);
  return entries.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content, headings } = await render(entry);
---
<ResearchLayout entry={entry} headings={headings}><Content /></ResearchLayout>
```

`ResearchLayout.astro` renders `ArticleHeader`, a main prose column containing `<slot />`, and `TableOfContents`. It passes no summary, updated date, reading time, or difficulty to `ArticleHeader`.

```astro
<!-- src/components/article/ArticleBody.astro -->
<article class="prose" data-article-body><slot /></article>
```

Use `ArticleBody` as the only prose wrapper inside `ResearchLayout`; prose width, code overflow, table overflow, figure captions, callouts, and reference spacing live in `prose.css`.

- [ ] **Step 5: Add the safe MDX fixture**

```mdx
---
title: "Dissecting an information stealer"
published: 2026-08-25
domain: "malware-dfir"
format: "case-study"
summary: "A safe fixture demonstrating evidence-first malware analysis writing."
tags: ["yara", "windows"]
draft: false
featured: false
---
import EvidenceBlock from "../../components/article/EvidenceBlock.astro";

## Executive summary

This fixture contains no live malware, direct executable link, or sensitive environment data.

## Static analysis

<EvidenceBlock id="Evidence 01" status="Verified">
  The fixture confirms that evidence blocks render with explicit verification state.
</EvidenceBlock>

```yara
rule Safe_Fixture { condition: false }
```

## References

1. Microsoft documentation.
```

- [ ] **Step 6: Run article tests and build**

Run: `npm run test:e2e -- tests/e2e/article.spec.ts && npm run check && npm run build`  
Expected: PASS; both research fixtures generate static routes.

- [ ] **Step 7: Commit the reading system**

```bash
git add src/styles/prose.css src/components/article src/layouts/ResearchLayout.astro src/pages/research src/content/research/dissecting-an-information-stealer.mdx tests/e2e/article.spec.ts
git commit -m "feat: add evidence-first article system"
```

### Task 7: Portfolio Pages, RSS, Sitemap, and 404

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/projects.astro`
- Create: `src/pages/404.astro`
- Create: `src/pages/rss.xml.ts`
- Create: `src/components/projects/ProjectPreview.astro`
- Modify: `src/pages/index.astro`
- Create: `public/favicon.svg`
- Create: `public/robots.txt`
- Create: `tests/e2e/accessibility.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout`, research collection, homepage placeholder sections.
- Produces: lightweight portfolio, feed, sitemap integration, robots, favicon, custom 404.

- [ ] **Step 1: Write failing route and accessibility tests**

```ts
// tests/e2e/accessibility.spec.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/research/", "/about/", "/projects/", "/404.html"]) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  });
}
```

- [ ] **Step 2: Run tests and verify missing-route failures**

Run: `npm run test:e2e -- tests/e2e/accessibility.spec.ts`  
Expected: FAIL for pages that do not exist.

- [ ] **Step 3: Implement lightweight About and Projects pages**

Use this factual, non-personal initial copy; do not invent employers, certifications, metrics, email addresses, or social handles:

```astro
<!-- src/pages/about.astro -->
<BaseLayout title="About | HSEC">
  <h1>About</h1>
  <p>HSEC is an independent research notebook focused on Malware &amp; DFIR, Cloud Security, and Security Engineering.</p>
  <p>Personal biography, achievements, certifications, and contact links are added only from information supplied and approved by the site owner.</p>
</BaseLayout>
```

```astro
<!-- src/pages/projects.astro -->
<BaseLayout title="Projects | HSEC">
  <h1>Selected projects</h1>
  <p>Project entries will appear here after their repository links, scope, and claims have been verified by the site owner.</p>
</BaseLayout>
```

```astro
---
// src/components/projects/ProjectPreview.astro
interface Props { title: string; summary: string; href: string; }
const { title, summary, href } = Astro.props;
---
<article class="project-preview"><h3><a href={href}>{title}</a></h3><p>{summary}</p></article>
```

Do not render `ProjectPreview` until at least one owner-verified project exists; the component is ready without inventing project data.

- [ ] **Step 4: Implement RSS and static support files**

```ts
// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../site.config";

export async function GET(context: { site?: URL }) {
  const entries = (await getCollection("research", ({ data }) => !data.draft)).sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? new URL("http://localhost:4321"),
    items: entries.map(({ id, data }) => ({ title: data.title, description: data.summary, pubDate: data.published, link: `/research/${id}/` })),
  });
}
```

Set `robots.txt` to exactly:

```text
User-agent: *
Allow: /
```

The Astro sitemap integration generates `sitemap-index.xml`. The 404 page links to `/`, `/research/`, and all three domain pages.

- [ ] **Step 5: Replace homepage placeholders**

```astro
<section id="selected-projects" aria-labelledby="projects-title">
  <h2 id="projects-title">Selected projects</h2>
  <p>Verified project notes will be published here.</p>
  <a href="/projects/">View projects</a>
</section>
<section id="profile" aria-labelledby="profile-title">
  <h2 id="profile-title">Independent security practice.</h2>
  <p>Research across Malware &amp; DFIR, Cloud Security, and Security Engineering.</p>
  <a href="/about/">About this practice</a>
</section>
```

Keep the recent visible research rendering from Task 4. Do not add experience or résumé sections.

- [ ] **Step 6: Run route, accessibility, and build checks**

Run: `npm run test:e2e -- tests/e2e/accessibility.spec.ts && npm run check && npm run build`  
Expected: PASS; `dist/rss.xml`, `dist/sitemap-index.xml`, and `dist/404.html` exist.

- [ ] **Step 7: Commit auxiliary pages**

```bash
git add src/pages src/components public tests/e2e/accessibility.spec.ts
git commit -m "feat: add portfolio and discovery endpoints"
```

### Task 8: CI, Deployment, and Release Verification

**Files:**
- Create: `scripts/assert-built-site.mjs`
- Create: `lighthouserc.cjs`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: every build/test command from Tasks 1–7.
- Produces: fail-closed CI, GitHub Pages deployment, performance budget, final authoring/deploy instructions.

- [ ] **Step 1: Write the failing built-site assertion**

```js
// scripts/assert-built-site.mjs
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] ?? "dist";
const required = ["index.html", "research/index.html", "search-index.json", "rss.xml", "sitemap-index.xml", "404.html"];
await Promise.all(required.map((path) => access(join(root, path))));
const home = await readFile(join(root, "index.html"), "utf8");
if (!home.includes("Explore the domains")) throw new Error("Homepage is missing the domain index");
if (home.includes("Static and behavioral analysis of a Windows sample")) throw new Error("Removed article dek leaked into homepage output");
console.log("Built-site assertions passed");
```

Verify failure without touching generated output:

```bash
built_probe_dir=$(mktemp -d)
node scripts/assert-built-site.mjs "$built_probe_dir"
rmdir "$built_probe_dir"
```

Expected: the Node command FAILS with missing `index.html`; `rmdir` removes the still-empty temporary directory.

- [ ] **Step 2: Configure exact Lighthouse budgets**

```js
// lighthouserc.cjs
module.exports = {
  ci: {
    collect: { staticDistDir: "./dist", url: ["http://localhost/"] },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }]
      }
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" }
  }
};
```

Append `.lighthouseci/` to `.gitignore` so local reports never enter the repository.

- [ ] **Step 3: Add fail-closed CI**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
      - run: npm run check
      - run: npm run build
        env:
          SITE_URL: https://${{ github.repository_owner }}.github.io
      - run: npm run test:built
      - run: npm run test:links
      - run: npm run test:e2e
      - run: npm run test:lighthouse
```

- [ ] **Step 4: Add GitHub Pages deployment**

```yaml
# .github/workflows/deploy.yml
name: Deploy Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
      - run: npm run check
      - run: npm run build
        env:
          SITE_URL: https://${{ github.repository_owner }}.github.io
      - run: npm run test:built
      - run: npm run test:links
      - run: npm run test:e2e
      - run: npm run test:lighthouse
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Document the exact local authoring and release workflow**

Add to `README.md`:

```text
npm install
npm run dev
npm test
npm run check
npm run build
npm run test:built
npm run test:links
npm run test:e2e
```

State that the repository name must equal the authenticated GitHub account login followed by `.github.io`, remain public on GitHub Free, and have Pages source set to GitHub Actions. Resolve the login read-only with `gh api user --jq .login` during deployment preparation; never invent it. State that `draft: true` is not a confidentiality boundary.

- [ ] **Step 6: Run the complete release gate locally**

Run:

```bash
npm ci
npm test
npm run check
SITE_URL=http://localhost:4321 npm run build
npm run test:built
npm run test:links
npm run test:e2e
npm run test:lighthouse
```

Expected: every command exits 0; Lighthouse meets all four configured scores.

- [ ] **Step 7: Inspect the rendered pages at desktop and mobile breakpoints**

Use Playwright screenshots at 1440×900 and 390×844 for `/`, `/research/`, one domain page, one article, `/about/`, `/projects/`, and `/404.html`. Verify first-viewport focus, index-after-scroll order, reduced motion, no overflow in code/table/URL content, and article-header metadata restrictions.

- [ ] **Step 8: Commit CI and release documentation**

```bash
git add scripts/assert-built-site.mjs lighthouserc.cjs .github/workflows package.json package-lock.json README.md
git commit -m "ci: add fail-closed Pages release pipeline"
```

## Website Completion Gate

Before calling the website complete:

```bash
git status --short
npm ci
npm test
npm run check
SITE_URL=http://localhost:4321 npm run build
npm run test:built
npm run test:links
npm run test:e2e
npm run test:lighthouse
```

Expected:

- Working tree contains only intentional changes.
- All commands exit 0.
- Static files include homepage, research index, domain pages, articles, About, Projects, RSS, sitemap, search index, and 404.
- No external publish, repository creation, or GitHub Pages settings change occurs without explicit user approval at action time.
