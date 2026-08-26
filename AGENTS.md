# Project instructions

When the user explicitly asks to run the editorial pipeline or use the editorial subagents:

1. Resolve a stable kebab-case slug and use only `.work/editorial/<slug>/` for work-in-progress artifacts.
2. Run `research_planner`; root persists its returned Markdown as `01-research-brief.md`; stop if its status is blocked.
3. Run `evidence_verifier`; root persists its returned Markdown as `02-evidence-ledger.md`; stop if required claims remain unsupported or conflicted.
4. Run `technical_writer` in read-only mode. Root persists the returned Markdown as `03-draft.md`; the writer never writes the workspace.
5. Run `security_reviewer and site_qa in parallel`, both read-only. Root persists the returned Markdown as `04-security-review.md` and `05-site-qa.md`; wait for both.
6. Root, not site_qa, runs approved QA commands, records each command and exit status in `05-site-qa.md`, and may set QA to `PASS` only with successful evidence. Do not let a reviewer edit the draft silently.
7. The root agent writes `06-release-report.md` from the two reviews. Contract-valid artifacts are not release-ready: publish authorization remains exactly `NOT GRANTED` until the user gives separate approval.
8. Present blockers, limitations, exact changed files, and validation evidence to the user.
9. Never copy the draft into `src/content/research/` without explicit user approval.
10. Never commit, push, deploy, or publish without explicit user approval at the corresponding step.

Every persisted artifact has a structurally valid frontmatter block. All six use the same non-empty topic and stable kebab-case slug, their exact assigned `phase` and `generated_by`, and a `complete` or `blocked` status. A blocked artifact includes a non-empty `# Blocking issues` section. Security, QA, and release reports include their required decisions; a QA `PASS` also includes a command/exit-status table. The release report's `# Publish authorization` content is exactly `NOT GRANTED`.

For normal website implementation tasks, do not trigger the editorial pipeline unless the user or an applicable plan explicitly asks for it.
