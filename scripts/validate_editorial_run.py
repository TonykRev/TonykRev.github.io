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
    failures = validate_run(Path(sys.argv[1]))
    if failures:
        print("\n".join(failures), file=sys.stderr)
        raise SystemExit(1)
    print(f"Validated editorial run: {sys.argv[1]}")
