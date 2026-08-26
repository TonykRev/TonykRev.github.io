from __future__ import annotations

import sys
import tomllib
from pathlib import Path

REQUIRED = ("name", "description", "developer_instructions")
SAFE_SANDBOXES = {"read-only", "workspace-write"}
ROOT_PERSISTED_ARTIFACT_AGENTS = {"technical_writer", "site_qa"}


def validate_agent_file(path: Path) -> list[str]:
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    errors = [f"missing {field}" for field in REQUIRED if not str(data.get(field, "")).strip()]
    sandbox = data.get("sandbox_mode", "workspace-write")
    if sandbox not in SAFE_SANDBOXES:
        errors.append(f"unsupported sandbox_mode: {sandbox}")
    if data.get("name") in ROOT_PERSISTED_ARTIFACT_AGENTS and sandbox != "read-only":
        errors.append(f"{data['name']} must use read-only sandbox")
    if data.get("name") and path.stem.replace("-", "_") != data["name"]:
        errors.append(f"filename/name mismatch: {path.stem} != {data['name']}")
    return errors


def main() -> int:
    paths = sorted(Path(".codex/agents").glob("*.toml"))
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
