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
