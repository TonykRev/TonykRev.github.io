# Editorial workflow

## Trigger

Ask Codex: `Run the editorial subagent pipeline for the topic I provide. Keep all draft artifacts local under the resolved .work/editorial directory and stop before copying or publishing.`

## Sequence

1. `research_planner` returns the brief; root saves `01-research-brief.md`.
2. `evidence_verifier` returns the ledger; root saves `02-evidence-ledger.md` or blocks the run.
3. `technical_writer` writes `03-draft.mdx` using supported claims only.
4. `security_reviewer` and `site_qa` run in parallel; root saves the returned security review as `04-security-review.md`, while site QA writes `05-site-qa.md`.
5. Root writes `06-release-report.md` with publish authorization set to `NOT GRANTED`.

## Blocked state

Stop at the first blocked sequential phase. During parallel review, wait for both reports, list every blocker, and do not edit the draft silently.

## Human review checklist

- Confirm scope, tone, claims, citations, screenshots, and disclosure boundaries.
- Confirm no live malware, executable download, secret, tenant identifier, personal data, or unsafe live IOC appears.
- Approve separately before copying into `src/content/research/`.
- Approve separately before commit, push, deployment, or publication.

## Usage boundary

Parallel subagents can consume more tokens than a single-agent workflow. This version runs on demand in Codex and requires no OpenAI API key, scheduled automation, or external service.
