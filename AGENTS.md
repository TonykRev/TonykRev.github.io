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
