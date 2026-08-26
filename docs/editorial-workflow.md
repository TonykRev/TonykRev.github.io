# Editorial workflow

## Trigger

Ask Codex: `Run the editorial subagent pipeline for the topic I provide. Keep all draft artifacts local under the resolved .work/editorial directory and stop before copying or publishing.`

## Sequence

1. `research_planner` returns the brief; root saves `01-research-brief.md`.
2. `evidence_verifier` returns the ledger; root saves `02-evidence-ledger.md` or blocks the run.
3. `technical_writer` is read-only and returns `03-draft.mdx`; root saves it using supported claims only.
4. `security_reviewer` and `site_qa` run in parallel and read-only. Root saves their returned Markdown as `04-security-review.md` and `05-site-qa.md`.
5. Root runs the QA commands approved by `site_qa`, records every command and exit status in `05-site-qa.md`, and only then can set a QA decision to `PASS`.
6. Root writes `06-release-report.md` with publish authorization set exactly to `NOT GRANTED`.

## Blocked state

Stop at the first blocked sequential phase. During parallel review, wait for both reports, list every blocker, and do not edit the draft silently.

## Artifact contract

The run validator parses a flat YAML frontmatter block rather than searching for text. Each of the six artifacts must use the same non-empty topic and stable kebab-case slug, its exact filename-owned phase and generator, and `complete` or `blocked` status. A blocked artifact requires a non-empty `# Blocking issues` section.

Security review, site QA, and release report each require explicit decisions. A QA `PASS` needs a `# Commands` table with at least one command and integer exit-status evidence; every recorded exit status must be `0`. A contract-valid run is still not release-ready: `# Publish authorization` must be exactly `NOT GRANTED` until a human separately approves publication.

The security, QA, and release templates start blocked so that copying a template cannot manufacture a passing review. Root replaces those placeholders only after collecting the required evidence.

## Human review checklist

- Confirm scope, tone, claims, citations, screenshots, and disclosure boundaries.
- Confirm no live malware, executable download, secret, tenant identifier, personal data, or unsafe live IOC appears.
- Approve separately before copying into `src/content/research/`.
- Approve separately before commit, push, deployment, or publication.

## Usage boundary

Parallel subagents can consume more tokens than a single-agent workflow. This version runs on demand in Codex and requires no OpenAI API key, scheduled automation, or external service.
