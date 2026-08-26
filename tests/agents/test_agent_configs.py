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

    def test_read_only_research_agents_name_their_artifacts(self):
        root = Path(".codex/agents")
        expected = {"research-planner.toml": "01-research-brief.md", "evidence-verifier.toml": "02-evidence-ledger.md"}
        for filename, artifact in expected.items():
            text = (root / filename).read_text(encoding="utf-8")
            self.assertIn('sandbox_mode = "read-only"', text)
            self.assertIn(artifact, text)

    def test_write_capable_agents_state_narrow_boundaries(self):
        root = Path(".codex/agents")
        writer = (root / "technical-writer.toml").read_text(encoding="utf-8")
        qa = (root / "site-qa.toml").read_text(encoding="utf-8")
        reviewer = (root / "security-reviewer.toml").read_text(encoding="utf-8")
        self.assertIn(".work/editorial/<slug>/03-draft.mdx", writer)
        self.assertIn("Do not commit, push, deploy, or publish", writer)
        self.assertIn('sandbox_mode = "read-only"', reviewer)
        self.assertIn("Do not edit source or content", qa)

    def test_root_instructions_preserve_sequence_and_human_publish_gate(self):
        text = Path("AGENTS.md").read_text(encoding="utf-8")
        ordered = ["research_planner", "evidence_verifier", "technical_writer"]
        positions = [text.index(name) for name in ordered]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("security_reviewer and site_qa in parallel", text)
        self.assertIn("Never commit, push, deploy, or publish without explicit user approval", text)


if __name__ == "__main__":
    unittest.main()
