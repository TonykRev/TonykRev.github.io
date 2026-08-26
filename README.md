# HSEC

HSEC is an English, static security research notebook focused on Malware & DFIR, Cloud Security, and Security Engineering.

## Local authoring

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

Research lives in `src/content/research/` as Markdown or MDX. The content schema accepts the formats `deep-research`, `case-study`, and `guide`. Set `draft: true` while iterating, but remember that drafts in a public repository are not confidential; keep sensitive material local and untracked.

## GitHub Pages release

For a personal `github.io` site, the repository name must equal the authenticated GitHub account login followed by `.github.io`. Resolve the login read-only during deployment preparation with `gh api user --jq .login`; never invent it. Keep the repository public when using GitHub Free and set the Pages source to GitHub Actions.

The workflows rerun unit tests, type checks, static build assertions, link checks, E2E checks, and Lighthouse budgets before uploading Pages artifacts. Any failure blocks deployment and preserves the currently published site. No CMS, database, analytics, paid search service, live malware, executable download, secret, tenant identifier, or personal data is required.
