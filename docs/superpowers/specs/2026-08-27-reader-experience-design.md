# Reader Experience Phase B

## Goal

Improve reading and discovery without changing the site's dark, research-notebook identity. Dark remains the first-render default. Readers can explicitly choose light mode, see their reading position within an article, and open search from anywhere.

## Scope

### Theme

- Add semantic dark and light color tokens.
- Render dark by default when no saved preference exists.
- Provide one accessible header control with a text label and pressed state.
- Persist an explicit reader choice in `localStorage`.
- Always use dark when no saved choice exists; do not infer an initial theme from the operating system.
- Apply the resolved theme before first paint to avoid a visible theme flash.

### Reading progress

- Render a slim fixed progress indicator only on research article pages.
- Measure progress from article start through article end; clamp to 0–100%.
- Update on scroll and resize using `requestAnimationFrame`.
- Respect reduced-motion preferences; no decorative animation is required.

### Global search

- Move the existing search dialog into the global layout.
- Add a header trigger with an accessible label.
- Support `Meta+K`, `Control+K`, and `/` when focus is not inside an editable control.
- Support Escape-to-close and focus the input when opening.
- Preserve the existing unavailable-index error state.
- Return at most ten visible research records with title, domain, format, and summary.
- Retain baseline navigation if JavaScript is unavailable.

## Components and data flow

`BaseLayout` renders `ThemeToggle` and the global `SearchOverlay`; `SiteHeader` exposes their triggers. A small inline theme bootstrap resolves the stored preference before paint. `ReadingProgress` is passed through `ResearchLayout`, where it observes the rendered article body.

The search dialog fetches the existing static `/search-index.json` only upon opening, caches the response for the page session, and filters the visible search records client-side.

## Accessibility and performance

- Controls have explicit accessible names and visible focus states.
- Dialog behavior retains native `dialog` semantics.
- Keyboard shortcuts do not hijack typing in inputs, textareas, selects, or content-editable elements.
- Theme and progress scripts are dependency-free and operate on small DOM sets.
- Progress work is batched with `requestAnimationFrame`.

## Tests

- E2E: dark default, manual light selection, persisted theme, keyboard open/close search, and rich search result metadata.
- E2E: progress indicator is absent on non-article pages and advances on an article page.
- Existing search error test remains valid.
- `npm test`, `npm run check`, production build, links, E2E, and Lighthouse remain green.

## Non-goals

- No social share controls.
- No remote search service, analytics, or account data.
- No animation library or third-party UI framework.
