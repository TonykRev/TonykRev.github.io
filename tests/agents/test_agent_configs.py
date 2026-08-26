import tempfile
import unittest
from pathlib import Path

from scripts.validate_agent_configs import validate_agent_file


class AgentConfigTests(unittest.TestCase):
    def test_pages_deploy_requires_manual_dispatch(self):
        workflow = Path(".github/workflows/deploy.yml").read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", workflow)
        self.assertNotIn("push:\n    branches: [main]", workflow)

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

    def test_rejects_workspace_write_for_root_persisted_editorial_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "technical-writer.toml"
            path.write_text(
                'name = "technical_writer"\n'
                'description = "Returns the draft to root."\n'
                'sandbox_mode = "workspace-write"\n'
                'developer_instructions = "Return Markdown."\n',
                encoding="utf-8",
            )
            self.assertIn("technical_writer must use read-only sandbox", validate_agent_file(path))

    def test_read_only_research_agents_name_their_artifacts(self):
        root = Path(".codex/agents")
        expected = {"research-planner.toml": "01-research-brief.md", "evidence-verifier.toml": "02-evidence-ledger.md"}
        for filename, artifact in expected.items():
            text = (root / filename).read_text(encoding="utf-8")
            self.assertIn('sandbox_mode = "read-only"', text)
            self.assertIn(artifact, text)

    def test_editorial_agents_return_artifacts_to_root_without_workspace_writes(self):
        root = Path(".codex/agents")
        writer = (root / "technical-writer.toml").read_text(encoding="utf-8")
        qa = (root / "site-qa.toml").read_text(encoding="utf-8")
        reviewer = (root / "security-reviewer.toml").read_text(encoding="utf-8")
        self.assertIn('sandbox_mode = "read-only"', writer)
        self.assertIn("Return complete Markdown for `03-draft.md`", writer)
        self.assertIn('sandbox_mode = "read-only"', qa)
        self.assertIn("return complete Markdown for `05-site-qa.md`", qa)
        self.assertIn("Do not run commands", qa)
        self.assertIn("Do not commit, push, deploy, or publish", writer)
        self.assertIn('sandbox_mode = "read-only"', reviewer)
        self.assertIn("Do not edit source or content", qa)

    def test_root_instructions_preserve_sequence_and_human_publish_gate(self):
        text = Path("AGENTS.md").read_text(encoding="utf-8")
        ordered = ["research_planner", "evidence_verifier", "technical_writer"]
        positions = [text.index(name) for name in ordered]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("security_reviewer and site_qa in parallel", text)
        self.assertIn("Root persists the returned Markdown", text)
        self.assertIn("Root, not site_qa, runs approved QA commands", text)
        self.assertIn("Never commit, push, deploy, or publish without explicit user approval", text)


if __name__ == "__main__":
    unittest.main()
