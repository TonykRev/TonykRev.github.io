import tempfile
import unittest
from pathlib import Path

from scripts.validate_editorial_run import REQUIRED_ARTIFACTS, validate_run


TOPIC = "Hash-only detection"
SLUG = "hash-only-detection"
ARTIFACT_CONTRACT = {
    "01-research-brief.md": ("research-brief", "research_planner"),
    "02-evidence-ledger.md": ("evidence-ledger", "evidence_verifier"),
    "03-draft.mdx": ("draft", "technical_writer"),
    "04-security-review.md": ("security-review", "security_reviewer"),
    "05-site-qa.md": ("site-qa", "site_qa"),
    "06-release-report.md": ("release-report", "root"),
}


def artifact_text(filename: str, *, topic: str = TOPIC, slug: str = SLUG, generated_by: str | None = None, status: str = "complete") -> str:
    phase, expected_owner = ARTIFACT_CONTRACT[filename]
    owner = generated_by or expected_owner
    body = ""
    if status == "blocked":
        body += "# Blocking issues\nEvidence is unavailable.\n\n"
    if filename == "04-security-review.md":
        body += "# Decision\nPASS\n"
    elif filename == "05-site-qa.md":
        body += "# Commands\n| Command | Exit status | Result |\n|---|---:|---|\n| `npm test` | 0 | passed |\n\n# Decision\nPASS\n"
    elif filename == "06-release-report.md":
        body += "# Security decision\nPASS\n\n# QA decision\nPASS\n\n# Release decision\nREADY FOR HUMAN REVIEW\n\n# Publish authorization\nNOT GRANTED\n"
    else:
        body += "Contract-valid fixture.\n"
    return (
        "---\n"
        f'topic: "{topic}"\n'
        f'slug: "{slug}"\n'
        f'phase: "{phase}"\n'
        f'status: "{status}"\n'
        f'generated_by: "{owner}"\n'
        "---\n\n"
        f"{body}"
    )


def write_valid_run(root: Path) -> None:
    for filename in REQUIRED_ARTIFACTS:
        root.joinpath(filename).write_text(artifact_text(filename), encoding="utf-8")


class EditorialRunTests(unittest.TestCase):
    def test_reports_missing_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            errors = validate_run(Path(directory))
            self.assertEqual(len(errors), len(REQUIRED_ARTIFACTS))

    def test_accepts_structurally_complete_human_gated_run(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_valid_run(root)
            self.assertEqual(validate_run(root), [])

    def test_rejects_mismatched_slug(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_valid_run(root)
            root.joinpath("03-draft.mdx").write_text(artifact_text("03-draft.mdx", slug="other-slug"), encoding="utf-8")
            self.assertIn("03-draft.mdx: slug does not match the run", validate_run(root))

    def test_rejects_wrong_generator(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_valid_run(root)
            root.joinpath("03-draft.mdx").write_text(
                artifact_text("03-draft.mdx", generated_by="site_qa"), encoding="utf-8"
            )
            self.assertIn("03-draft.mdx: generated_by must be technical_writer", validate_run(root))

    def test_rejects_fabricated_qa_pass_without_command_exit_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_valid_run(root)
            root.joinpath("05-site-qa.md").write_text(
                artifact_text("05-site-qa.md").replace(
                    "# Commands\n| Command | Exit status | Result |\n|---|---:|---|\n| `npm test` | 0 | passed |\n\n",
                    "# Commands\nNo commands were run.\n\n",
                ),
                encoding="utf-8",
            )
            self.assertIn("05-site-qa.md: PASS decision requires command and exit-status evidence", validate_run(root))

    def test_rejects_blocked_artifact_without_blocking_issues(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_valid_run(root)
            root.joinpath("02-evidence-ledger.md").write_text(
                artifact_text("02-evidence-ledger.md", status="blocked").replace(
                    "# Blocking issues\nEvidence is unavailable.\n\n", ""
                ),
                encoding="utf-8",
            )
            self.assertIn("02-evidence-ledger.md: blocked status requires a non-empty Blocking issues section", validate_run(root))

    def test_rejects_malformed_publish_authorization(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            write_valid_run(root)
            report = root / "06-release-report.md"
            report.write_text(
                report.read_text(encoding="utf-8").replace("# Publish authorization\nNOT GRANTED", "# Publish authorization\nGRANTED"),
                encoding="utf-8",
            )
            self.assertIn("release report publish authorization must be exactly NOT GRANTED", validate_run(root))


if __name__ == "__main__":
    unittest.main()
