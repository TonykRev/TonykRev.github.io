# Editorial Subagents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five project-scoped Codex agents and a human-gated orchestration workflow for planning, verifying, drafting, reviewing, and validating security research articles.

**Architecture:** Project-scoped TOML files under `.codex/agents/` define narrow agent roles. The root agent runs planner, verifier, and writer sequentially, then runs security review and site QA in parallel; work-in-progress artifacts stay under ignored `.work/editorial/`, and no agent commits, pushes, or publishes.

**Tech Stack:** Codex custom agents, TOML, AGENTS.md, Python 3 `tomllib`/`unittest`, Markdown workflow templates

**Spec:** `docs/superpowers/specs/2026-08-26-personal-security-blog-design.md`

## Global Constraints

- Agents are project-scoped under `.codex/agents/` and define `name`, `description`, and `developer_instructions`.
- `research_planner`, `evidence_verifier`, and `security_reviewer` are read-only.
- `technical_writer` may write only under `.work/editorial/<slug>/`.
- `site_qa` may create build/test artifacts but must not edit source or content.
- Workflow order is brief → evidence → draft → parallel security review and site QA → release candidate summary.
- No agent may commit, push, deploy, publish, upload samples, or communicate externally.
- Human approval is required before copying a draft into `src/content/research/` and again before external publishing.
- No live malware, executable download, secret, tenant identifier, personal data, or unsafe live IOC is accepted.
- Unsupported claims are reported, not silently rewritten as fact.
- Review agents report findings and evidence; they do not silently edit the draft.
- Subagents run on demand in Codex; there is no API-backed or scheduled autonomous workflow.

---

## File Map

```text
.
├── .codex/
│   ├── agents/
│   │   ├── evidence-verifier.toml
│   │   ├── research-planner.toml
│   │   ├── security-reviewer.toml
│   │   ├── site-qa.toml
│   │   └── technical-writer.toml
│   └── config.toml
├── docs/
│   ├── editorial-workflow.md
│   └── editorial/
│       ├── evidence-ledger-template.md
│       ├── release-report-template.md
│       ├── research-brief-template.md
│       └── security-review-template.md
├── scripts/
│   ├── validate_agent_configs.py
│   └── validate_editorial_run.py
├── tests/agents/
│   ├── test_agent_configs.py
│   └── test_editorial_run.py
├── .gitignore
└── AGENTS.md
```

Runtime artifacts are deliberately untracked:

```text
.work/editorial/<slug>/
├── 01-research-brief.md
├── 02-evidence-ledger.md
├── 03-draft.mdx
├── 04-security-review.md
├── 05-site-qa.md
└── 06-release-report.md
```

## Agent Handoff Contract

Each agent returns a short status summary to the root agent and writes only its assigned artifact when its sandbox allows writes. Every artifact starts with:

```yaml
---
topic: "Human-readable topic"
slug: "stable-kebab-case-slug"
phase: "research-brief"
status: "complete"
generated_by: "research_planner"
---
```

`phase` and `generated_by` change per artifact. `status` is `complete` or `blocked`; blocked artifacts include a `## Blocking issues` section.

### Task 1: Configuration Validator and Project Agent Settings

**Files:**
- Create: `.codex/config.toml`
- Create: `scripts/validate_agent_configs.py`
- Create: `tests/agents/test_agent_configs.py`

**Interfaces:**
- Consumes: TOML files under `.codex/agents/`.
- Produces: `validate_agent_file(path: Path) -> list[str]` and CLI exit code 0 only when every agent satisfies the project contract.

- [ ] **Step 1: Write failing validator tests**

```python
# tests/agents/test_agent_configs.py
import tempfile
import unittest
from pathlib import Path

from scripts.validate_agent_configs import validate_agent_file


class AgentConfigTests(unittest.TestCase):
    def test_requires_core_fields_and_safe_sandbox(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.toml"
            path.write_text('name = "bad"\nsandbox_mode = "danger-full-access"\n', encoding="utf-8")
            errors = validate_agent_file(path)
            self.assertIn("missing description", errors)
            self.assertIn("missing developer_instructions", errors)
            self.assertIn("unsupported sandbox_mode: danger-full-access", errors)

    def test_accepts_minimal_read_only_agent(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "reader.toml"
            path.write_text(
                'name = "reader"\n'
                'description = "Reads evidence."\n'
                'sandbox_mode = "read-only"\n'
                'developer_instructions = """Read only. Return evidence."""\n',
                encoding="utf-8",
            )
            self.assertEqual(validate_agent_file(path), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify failure**

Run: `python3 -m unittest tests.agents.test_agent_configs -v`  
Expected: FAIL because `scripts.validate_agent_configs` does not exist.

- [ ] **Step 3: Implement the strict TOML validator**

```python
# scripts/validate_agent_configs.py
from __future__ import annotations

import sys
import tomllib
from pathlib import Path

REQUIRED = ("name", "description", "developer_instructions")
SAFE_SANDBOXES = {"read-only", "workspace-write"}


def validate_agent_file(path: Path) -> list[str]:
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    errors = [f"missing {field}" for field in REQUIRED if not str(data.get(field, "")).strip()]
    sandbox = data.get("sandbox_mode", "workspace-write")
    if sandbox not in SAFE_SANDBOXES:
        errors.append(f"unsupported sandbox_mode: {sandbox}")
    if data.get("name") and path.stem.replace("-", "_") != data["name"]:
        errors.append(f"filename/name mismatch: {path.stem} != {data['name']}")
    return errors


def main() -> int:
    root = Path(".codex/agents")
    paths = sorted(root.glob("*.toml"))
    if not paths:
        print("No project agent files found", file=sys.stderr)
        return 1
    failures = []
    for path in paths:
        failures.extend(f"{path}: {error}" for error in validate_agent_file(path))
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print(f"Validated {len(paths)} project agents")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Add bounded project concurrency**

```toml
# .codex/config.toml
[agents]
enabled = true
max_concurrent_threads_per_session = 5
```

Do not set a project-wide model. Agent files inherit the active parent model and reasoning effort unless a future measured evaluation justifies role-specific overrides.

- [ ] **Step 5: Run validator tests**

Run: `python3 -m unittest tests.agents.test_agent_configs -v`  
Expected: PASS.

- [ ] **Step 6: Commit the validator foundation**

```bash
git add .codex/config.toml scripts/validate_agent_configs.py tests/agents/test_agent_configs.py
git commit -m "test: add Codex agent config validation"
```

### Task 2: Research Planning and Evidence Verification Agents

**Files:**
- Create: `.codex/agents/research-planner.toml`
- Create: `.codex/agents/evidence-verifier.toml`
- Create: `docs/editorial/research-brief-template.md`
- Create: `docs/editorial/evidence-ledger-template.md`
- Modify: `tests/agents/test_agent_configs.py`

**Interfaces:**
- Consumes: user topic and any user-supplied source material.
- Produces: `01-research-brief.md` then `02-evidence-ledger.md` under the same `.work/editorial/<slug>/` directory.

- [ ] **Step 1: Extend tests with exact role expectations**

```python
    def test_read_only_research_agents_name_their_artifacts(self):
        root = Path(".codex/agents")
        expected = {
            "research-planner.toml": "01-research-brief.md",
            "evidence-verifier.toml": "02-evidence-ledger.md",
        }
        for filename, artifact in expected.items():
            text = (root / filename).read_text(encoding="utf-8")
            self.assertIn('sandbox_mode = "read-only"', text)
            self.assertIn(artifact, text)
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `python3 -m unittest tests.agents.test_agent_configs.AgentConfigTests.test_read_only_research_agents_name_their_artifacts -v`  
Expected: FAIL because agent files do not exist.

- [ ] **Step 3: Add the research planner**

```toml
# .codex/agents/research-planner.toml
name = "research_planner"
description = "Read-only planner that turns an approved security topic into a bounded research brief and evidence checklist."
sandbox_mode = "read-only"
developer_instructions = """
Plan only. Do not draft the article, edit project files, browse beyond the authorized topic, or propose publication.
Define audience, scope, exclusions, research questions, required evidence, preferred primary sources, lab boundaries, and success criteria.
Treat malware, tenant data, identities, logs, and credentials as sensitive. Never request or distribute live malware, secrets, personal data, or direct executable links.
Return complete Markdown for `.work/editorial/<slug>/01-research-brief.md` using `docs/editorial/research-brief-template.md`.
If the topic is unsafe, underspecified, or cannot be researched responsibly, set status to blocked and list exact blocking issues.
"""
```

- [ ] **Step 4: Add the evidence verifier**

```toml
# .codex/agents/evidence-verifier.toml
name = "evidence_verifier"
description = "Read-only verifier that checks sources, dates, claims, citations, and uncertainty before drafting."
sandbox_mode = "read-only"
developer_instructions = """
Read the approved `01-research-brief.md` and available source material. Do not draft prose or edit the brief.
Prefer primary and authoritative sources. Record source title, URL or local path, publication date, access date, supported claims, conflicting evidence, and confidence.
Separate observed evidence, inference, and external claims. Reject unsupported claims instead of repairing them silently.
Do not retrieve, execute, upload, or redistribute malware. Defang unsafe URLs and indicators in returned content.
Return complete Markdown for `.work/editorial/<slug>/02-evidence-ledger.md` using `docs/editorial/evidence-ledger-template.md`.
Set status to blocked when required claims lack credible support.
"""
```

- [ ] **Step 5: Add exact templates**

```md
<!-- docs/editorial/research-brief-template.md -->
---
topic: "Research topic"
slug: "research-topic"
phase: "research-brief"
status: "complete"
generated_by: "research_planner"
---
# Objective
# Audience
# Scope
# Explicit exclusions
# Research questions
# Required evidence
# Preferred primary sources
# Lab safety boundary
# Article outline
# Acceptance criteria
# Blocking issues
None.
```

```md
<!-- docs/editorial/evidence-ledger-template.md -->
---
topic: "Research topic"
slug: "research-topic"
phase: "evidence-ledger"
status: "complete"
generated_by: "evidence_verifier"
---
# Evidence ledger
| Claim ID | Claim | Evidence type | Source | Source date | Access date | Confidence | Status |
|---|---|---|---|---|---|---|---|
| C-001 | Example claim | external | Authoritative URL or local path | 2026-08-01 | 2026-08-26 | high | supported |

# Conflicts
None.
# Missing evidence
None.
# Drafting constraints
Use only claims marked supported; label inference explicitly.
```

- [ ] **Step 6: Run config tests and full validator**

Run: `python3 -m unittest tests.agents.test_agent_configs -v && python3 scripts/validate_agent_configs.py`  
Expected: PASS and `Validated 2 project agents`.

- [ ] **Step 7: Commit research agents**

```bash
git add .codex/agents/research-planner.toml .codex/agents/evidence-verifier.toml docs/editorial tests/agents/test_agent_configs.py
git commit -m "feat: add research planning agents"
```

### Task 3: Writer, Security Reviewer, and Site QA Agents

**Files:**
- Create: `.codex/agents/technical-writer.toml`
- Create: `.codex/agents/security-reviewer.toml`
- Create: `.codex/agents/site-qa.toml`
- Create: `docs/editorial/security-review-template.md`
- Create: `docs/editorial/release-report-template.md`
- Modify: `tests/agents/test_agent_configs.py`

**Interfaces:**
- Consumes: approved brief, supported evidence ledger, website commands from the website plan.
- Produces: `03-draft.mdx`, `04-security-review.md`, `05-site-qa.md`, and inputs for the root-authored release report.

- [ ] **Step 1: Add failing tests for write boundaries and human gates**

```python
    def test_write_capable_agents_state_narrow_boundaries(self):
        root = Path(".codex/agents")
        writer = (root / "technical-writer.toml").read_text(encoding="utf-8")
        qa = (root / "site-qa.toml").read_text(encoding="utf-8")
        reviewer = (root / "security-reviewer.toml").read_text(encoding="utf-8")
        self.assertIn(".work/editorial/<slug>/03-draft.mdx", writer)
        self.assertIn("Do not commit, push, deploy, or publish", writer)
        self.assertIn('sandbox_mode = "read-only"', reviewer)
        self.assertIn("Do not edit source or content", qa)
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `python3 -m unittest tests.agents.test_agent_configs.AgentConfigTests.test_write_capable_agents_state_narrow_boundaries -v`  
Expected: FAIL because the three agent files do not exist.

- [ ] **Step 3: Add the technical writer**

```toml
# .codex/agents/technical-writer.toml
name = "technical_writer"
description = "English technical writer that converts an approved brief and supported evidence ledger into a reviewable MDX draft."
sandbox_mode = "workspace-write"
developer_instructions = """
Write only `.work/editorial/<slug>/03-draft.mdx`. Do not modify `src/`, configuration, tests, or earlier artifacts.
Use English. Follow the approved domain and format enums and the article structure in the design spec.
Use only claims marked supported. Label inference clearly. Keep citations close to supported claims. Do not invent biography, metrics, commands, findings, IOC, sources, or lab results.
Never include live malware, direct executable downloads, secrets, tenant identifiers, personal data, or unsafe live URLs. Defang indicators when needed.
Do not commit, push, deploy, or publish. Return a concise summary of sections written and claims intentionally omitted.
"""
```

- [ ] **Step 4: Add the security reviewer and site QA**

```toml
# .codex/agents/security-reviewer.toml
name = "security_reviewer"
description = "Read-only reviewer for unsafe artifacts, sensitive data, overclaims, IOC handling, and disclosure boundaries."
sandbox_mode = "read-only"
developer_instructions = """
Review `03-draft.mdx` against the brief and evidence ledger. Do not edit the draft.
Report live malware or executable links, unsafe URLs, secrets, tenant identifiers, personal data, unverified claims, misleading certainty, missing defanging, and disclosure risks.
Classify each finding as blocker, major, or minor and cite the draft section and supporting artifact.
Return complete Markdown for `.work/editorial/<slug>/04-security-review.md` using `docs/editorial/security-review-template.md`.
Do not commit, push, deploy, publish, upload, or communicate externally.
"""
```

```toml
# .codex/agents/site-qa.toml
name = "site_qa"
description = "QA agent that validates a candidate article and rendered site without editing source or content."
sandbox_mode = "workspace-write"
developer_instructions = """
Do not edit source or content. Write only `.work/editorial/<slug>/05-site-qa.md` plus build/test output created by approved project commands.
Validate draft frontmatter against the approved schema, then run the repository's test, check, build, link, browser, and accessibility commands that exist.
Inspect desktop and mobile rendering for overflow, broken code blocks, tables, long URLs, missing alt text, focus visibility, and reduced-motion behavior.
Return complete Markdown for `.work/editorial/<slug>/05-site-qa.md` with every command, exit status, observed failure, screenshot path, and an explicit pass or blocked decision.
Do not commit, push, deploy, publish, or change GitHub settings.
"""
```

- [ ] **Step 5: Add review templates**

```md
<!-- docs/editorial/security-review-template.md -->
---
topic: "Research topic"
slug: "research-topic"
phase: "security-review"
status: "complete"
generated_by: "security_reviewer"
---
# Decision
PASS
# Blockers
None.
# Major findings
None.
# Minor findings
None.
# Defanging review
No unsafe live indicators found.
# Sensitive-data review
No secrets, tenant identifiers, or personal data found.
# Claim-to-evidence review
All factual claims map to supported evidence IDs.
# Required changes
None.
```

```md
<!-- docs/editorial/release-report-template.md -->
---
topic: "Research topic"
slug: "research-topic"
phase: "release-report"
status: "complete"
generated_by: "root"
---
# Artifact paths
# Planner status
# Evidence status
# Draft status
# Security decision
# QA decision
# Remaining human decisions
# Publish authorization
NOT GRANTED
```

- [ ] **Step 6: Run all config checks**

Run: `python3 -m unittest tests.agents.test_agent_configs -v && python3 scripts/validate_agent_configs.py`  
Expected: PASS and `Validated 5 project agents`.

- [ ] **Step 7: Commit writer and reviewers**

```bash
git add .codex/agents docs/editorial tests/agents/test_agent_configs.py
git commit -m "feat: add editorial writer and review agents"
```

### Task 4: Root Orchestration and Untracked Workspace

**Files:**
- Create: `AGENTS.md`
- Create: `docs/editorial-workflow.md`
- Modify: `.gitignore`
- Modify: `tests/agents/test_agent_configs.py`

**Interfaces:**
- Consumes: all five custom agents and artifact contracts.
- Produces: exact trigger, sequencing, parallel-review, stopping, and human-approval rules for the root agent.

- [ ] **Step 1: Write a failing orchestration-contract test**

```python
    def test_root_instructions_preserve_sequence_and_human_publish_gate(self):
        text = Path("AGENTS.md").read_text(encoding="utf-8")
        ordered = ["research_planner", "evidence_verifier", "technical_writer"]
        positions = [text.index(name) for name in ordered]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("security_reviewer and site_qa in parallel", text)
        self.assertIn("Never commit, push, deploy, or publish without explicit user approval", text)
```

- [ ] **Step 2: Run the test and verify failure**

Run: `python3 -m unittest tests.agents.test_agent_configs.AgentConfigTests.test_root_instructions_preserve_sequence_and_human_publish_gate -v`  
Expected: FAIL because `AGENTS.md` does not exist.

- [ ] **Step 3: Add the exact root workflow to `AGENTS.md`**

```md
# Project instructions

When the user explicitly asks to run the editorial pipeline or use the editorial subagents:

1. Resolve a stable kebab-case slug and use only `.work/editorial/<slug>/` for work-in-progress artifacts.
2. Run `research_planner`; save its returned Markdown as `01-research-brief.md`; stop if its status is blocked.
3. Run `evidence_verifier`; save its returned Markdown as `02-evidence-ledger.md`; stop if required claims remain unsupported or conflicted.
4. Run `technical_writer`; it may write only `03-draft.mdx`.
5. Run `security_reviewer and site_qa in parallel`; save the security reviewer's returned Markdown as `04-security-review.md`; wait for both.
6. The root agent writes `06-release-report.md` from the two reviews. Do not let a reviewer edit the draft silently.
7. Present blockers, limitations, exact changed files, and validation evidence to the user.
8. Never copy the draft into `src/content/research/` without explicit user approval.
9. Never commit, push, deploy, or publish without explicit user approval at the corresponding step.

For normal website implementation tasks, do not trigger the editorial pipeline unless the user or an applicable plan explicitly asks for it.
```

- [ ] **Step 4: Ignore all work-in-progress editorial artifacts**

Append exactly:

```gitignore
.work/
```

Verify with exact paths:

```bash
mkdir -p .work/editorial/probe
touch .work/editorial/probe/private.txt
git status --short
git check-ignore --no-index .work/editorial/probe/private.txt
rm .work/editorial/probe/private.txt
rmdir .work/editorial/probe
```

Expected: the probe is absent from status, `git check-ignore` prints its path, and only the explicit probe file plus empty directories are removed.

- [ ] **Step 5: Document on-demand operation**

```md
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
```

- [ ] **Step 6: Run orchestration and config validation**

Run: `python3 -m unittest tests.agents.test_agent_configs -v && python3 scripts/validate_agent_configs.py && git check-ignore .work/editorial/probe/private.txt`  
Expected: tests PASS, five agents validate, and `git check-ignore` prints the probe path.

- [ ] **Step 7: Commit orchestration**

```bash
git add AGENTS.md .gitignore docs/editorial-workflow.md tests/agents/test_agent_configs.py
git commit -m "docs: define human-gated editorial orchestration"
```

### Task 5: Editorial Run Validator and Safe Dry Run

**Files:**
- Create: `scripts/validate_editorial_run.py`
- Create: `tests/agents/test_editorial_run.py`
- Runtime only: `.work/editorial/hash-only-detection/`

**Interfaces:**
- Consumes: one workflow directory containing all six artifact files.
- Produces: `validate_run(directory: Path) -> list[str]` and a successful end-to-end on-demand subagent dry run that stops before source changes.

- [ ] **Step 1: Write failing run-validator tests**

```python
# tests/agents/test_editorial_run.py
import tempfile
import unittest
from pathlib import Path

from scripts.validate_editorial_run import REQUIRED_ARTIFACTS, validate_run


class EditorialRunTests(unittest.TestCase):
    def test_reports_missing_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            errors = validate_run(Path(directory))
            self.assertEqual(len(errors), len(REQUIRED_ARTIFACTS))

    def test_accepts_complete_human_gated_run(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for filename, phase in REQUIRED_ARTIFACTS.items():
                root.joinpath(filename).write_text(
                    f'---\ntopic: "Hash-only detection"\nslug: "hash-only-detection"\nphase: "{phase}"\nstatus: "complete"\ngenerated_by: "fixture"\n---\n\nValidated fixture.\n',
                    encoding="utf-8",
                )
            root.joinpath("06-release-report.md").write_text(
                root.joinpath("06-release-report.md").read_text(encoding="utf-8") + "\nPublish authorization: NOT GRANTED\n",
                encoding="utf-8",
            )
            self.assertEqual(validate_run(root), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify failure**

Run: `python3 -m unittest tests.agents.test_editorial_run -v`  
Expected: FAIL because `scripts.validate_editorial_run` does not exist.

- [ ] **Step 3: Implement the artifact-contract validator**

```python
# scripts/validate_editorial_run.py
from __future__ import annotations

import sys
from pathlib import Path

REQUIRED_ARTIFACTS = {
    "01-research-brief.md": "research-brief",
    "02-evidence-ledger.md": "evidence-ledger",
    "03-draft.mdx": "draft",
    "04-security-review.md": "security-review",
    "05-site-qa.md": "site-qa",
    "06-release-report.md": "release-report",
}


def validate_run(directory: Path) -> list[str]:
    errors = []
    for filename, phase in REQUIRED_ARTIFACTS.items():
        path = directory / filename
        if not path.is_file():
            errors.append(f"missing {filename}")
            continue
        text = path.read_text(encoding="utf-8")
        if f'phase: "{phase}"' not in text:
            errors.append(f"{filename}: wrong or missing phase")
        if 'status: "complete"' not in text and 'status: "blocked"' not in text:
            errors.append(f"{filename}: missing valid status")
    report = directory / "06-release-report.md"
    if report.is_file() and "Publish authorization: NOT GRANTED" not in report.read_text(encoding="utf-8"):
        errors.append("release report must default to NOT GRANTED")
    return errors


if __name__ == "__main__":
    target = Path(sys.argv[1])
    failures = validate_run(target)
    if failures:
        print("\n".join(failures), file=sys.stderr)
        raise SystemExit(1)
    print(f"Validated editorial run: {target}")
```

- [ ] **Step 4: Run validator tests**

Run: `python3 -m unittest tests.agents.test_editorial_run -v`  
Expected: PASS.

- [ ] **Step 5: Execute one safe on-demand subagent dry run**

Use this exact user-visible prompt in Codex:

```text
Run the editorial subagent pipeline for: Why hash-only malware detection is brittle.
Use only safe public documentation and conceptual examples. Do not retrieve or include malware, live indicators, executable links, secrets, personal data, or tenant data.
Keep every artifact under .work/editorial/hash-only-detection/.
Stop before copying the draft into src/, committing, pushing, deploying, or publishing.
```

Expected:

- Planner, verifier, and writer run sequentially.
- Security reviewer and site QA run in parallel after the draft.
- Six artifacts exist under the ignored work directory.
- Root summary states `Publish authorization: NOT GRANTED`.
- `git status --short` shows no generated editorial artifacts.

- [ ] **Step 6: Validate the dry run and inspect every agent result**

Run:

```bash
python3 scripts/validate_agent_configs.py
python3 scripts/validate_editorial_run.py .work/editorial/hash-only-detection
python3 -m unittest discover -s tests/agents -v
git status --short
```

Expected: all validators/tests pass; Git status contains only intentional tracked implementation changes.

- [ ] **Step 7: Commit the run validator**

```bash
git add scripts/validate_editorial_run.py tests/agents/test_editorial_run.py
git commit -m "test: validate editorial subagent handoffs"
```

## Subagent System Completion Gate

```bash
python3 scripts/validate_agent_configs.py
python3 scripts/validate_editorial_run.py .work/editorial/hash-only-detection
python3 -m unittest discover -s tests/agents -v
git check-ignore --no-index .work/editorial/hash-only-detection/03-draft.mdx
git status --short
```

Expected:

- Exactly five project agents validate.
- Dry-run artifacts satisfy phase and human-gate contracts.
- Draft remains ignored and outside `src/content/research/`.
- No commit, push, deploy, publication, API key creation, or external side effect occurs during the dry run.
