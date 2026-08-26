from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REQUIRED_ARTIFACTS = {
    "01-research-brief.md": {"phase": "research-brief", "generated_by": "research_planner"},
    "02-evidence-ledger.md": {"phase": "evidence-ledger", "generated_by": "evidence_verifier"},
    "03-draft.mdx": {"phase": "draft", "generated_by": "technical_writer"},
    "04-security-review.md": {"phase": "security-review", "generated_by": "security_reviewer"},
    "05-site-qa.md": {"phase": "site-qa", "generated_by": "site_qa"},
    "06-release-report.md": {"phase": "release-report", "generated_by": "root"},
}
REQUIRED_METADATA = ("topic", "slug", "phase", "status", "generated_by")
VALID_STATUSES = {"complete", "blocked"}
VALID_REVIEW_DECISIONS = {"PASS", "BLOCKED"}
VALID_RELEASE_DECISIONS = {"READY FOR HUMAN REVIEW", "BLOCKED"}
FIELD_PATTERN = re.compile(r"^(?P<key>[A-Za-z][A-Za-z0-9_-]*):[ \t]*(?P<value>.+?)[ \t]*$")
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str, list[str]]:
    """Parse the flat string-only YAML frontmatter used by editorial artifacts."""
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        return {}, text, ["missing opening frontmatter delimiter"]

    fields: dict[str, str] = {}
    errors: list[str] = []
    for index, line in enumerate(lines[1:], start=2):
        if line == "---":
            return fields, "\n".join(lines[index:]), errors
        match = FIELD_PATTERN.match(line)
        if not match:
            errors.append(f"malformed frontmatter line {index}")
            continue
        key, raw_value = match.group("key"), match.group("value")
        if key in fields:
            errors.append(f"duplicate frontmatter field: {key}")
            continue
        if raw_value.startswith('"'):
            try:
                value = json.loads(raw_value)
            except json.JSONDecodeError:
                errors.append(f"malformed quoted value for {key}")
                continue
            if not isinstance(value, str):
                errors.append(f"frontmatter value for {key} must be a string")
                continue
        else:
            value = raw_value
        fields[key] = value
    errors.append("missing closing frontmatter delimiter")
    return fields, "", errors


def section_content(body: str, heading: str) -> str | None:
    heading_match = re.search(rf"(?m)^# {re.escape(heading)}[ \t]*$", body)
    if not heading_match:
        return None
    next_heading = re.search(r"(?m)^# ", body[heading_match.end() :])
    end = heading_match.end() + (next_heading.start() if next_heading else len(body[heading_match.end() :]))
    return body[heading_match.end() : end].strip()


def validate_decision(filename: str, body: str, heading: str, allowed: set[str], errors: list[str]) -> str | None:
    decision = section_content(body, heading)
    if decision not in allowed:
        choices = ", ".join(sorted(allowed))
        errors.append(f"{filename}: {heading.lower()} must be one of: {choices}")
        return None
    return decision


def qa_command_exit_evidence(body: str) -> list[int]:
    commands = section_content(body, "Commands")
    if commands is None:
        return []
    lines = [line.strip() for line in commands.splitlines() if line.strip().startswith("|")]
    for index, line in enumerate(lines):
        headers = [cell.strip().lower() for cell in line.strip("|").split("|")]
        if "command" not in headers or "exit status" not in headers:
            continue
        command_index = headers.index("command")
        exit_index = headers.index("exit status")
        exits: list[int] = []
        for row in lines[index + 1 :]:
            cells = [cell.strip() for cell in row.strip("|").split("|")]
            if all(re.fullmatch(r"[: -]+", cell) for cell in cells):
                continue
            if len(cells) <= max(command_index, exit_index) or not cells[command_index]:
                continue
            try:
                exits.append(int(cells[exit_index]))
            except ValueError:
                return []
        return exits
    return []


def validate_run(directory: Path) -> list[str]:
    errors: list[str] = []
    run_topic: str | None = None
    run_slug: str | None = None
    parsed_artifacts: dict[str, tuple[dict[str, str], str]] = {}

    for filename, contract in REQUIRED_ARTIFACTS.items():
        path = directory / filename
        if not path.is_file():
            errors.append(f"missing {filename}")
            continue

        metadata, body, parse_errors = parse_frontmatter(path.read_text(encoding="utf-8"))
        errors.extend(f"{filename}: {error}" for error in parse_errors)
        parsed_artifacts[filename] = (metadata, body)
        for field in REQUIRED_METADATA:
            if not metadata.get(field, "").strip():
                errors.append(f"{filename}: missing {field}")
        if metadata.get("phase") and metadata["phase"] != contract["phase"]:
            errors.append(f"{filename}: phase must be {contract['phase']}")
        if metadata.get("generated_by") and metadata["generated_by"] != contract["generated_by"]:
            errors.append(f"{filename}: generated_by must be {contract['generated_by']}")
        if metadata.get("status") and metadata["status"] not in VALID_STATUSES:
            errors.append(f"{filename}: status must be complete or blocked")
        if metadata.get("status") == "blocked":
            issues = section_content(body, "Blocking issues")
            if not issues or issues.lower() == "none.":
                errors.append(f"{filename}: blocked status requires a non-empty Blocking issues section")

        topic, slug = metadata.get("topic"), metadata.get("slug")
        if topic:
            if run_topic is None:
                run_topic = topic
            elif topic != run_topic:
                errors.append(f"{filename}: topic does not match the run")
        if slug:
            if not SLUG_PATTERN.fullmatch(slug):
                errors.append(f"{filename}: slug must be stable kebab-case")
            if run_slug is None:
                run_slug = slug
            elif slug != run_slug:
                errors.append(f"{filename}: slug does not match the run")

    security = parsed_artifacts.get("04-security-review.md")
    if security:
        validate_decision("04-security-review.md", security[1], "Decision", VALID_REVIEW_DECISIONS, errors)

    qa = parsed_artifacts.get("05-site-qa.md")
    if qa:
        qa_decision = validate_decision("05-site-qa.md", qa[1], "Decision", VALID_REVIEW_DECISIONS, errors)
        command_exits = qa_command_exit_evidence(qa[1])
        if qa_decision == "PASS" and (not command_exits or any(code != 0 for code in command_exits)):
            errors.append("05-site-qa.md: PASS decision requires command and exit-status evidence")
        elif not command_exits:
            errors.append("05-site-qa.md: requires command and exit-status evidence")

    release = parsed_artifacts.get("06-release-report.md")
    if release:
        body = release[1]
        validate_decision("06-release-report.md", body, "Security decision", VALID_REVIEW_DECISIONS, errors)
        validate_decision("06-release-report.md", body, "QA decision", VALID_REVIEW_DECISIONS, errors)
        validate_decision("06-release-report.md", body, "Release decision", VALID_RELEASE_DECISIONS, errors)
        if section_content(body, "Publish authorization") != "NOT GRANTED":
            errors.append("release report publish authorization must be exactly NOT GRANTED")
    return errors


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: validate_editorial_run.py <run-directory>", file=sys.stderr)
        raise SystemExit(2)
    target = Path(sys.argv[1])
    failures = validate_run(target)
    if failures:
        print("\n".join(failures), file=sys.stderr)
        raise SystemExit(1)
    print(f"Validated editorial run contract: {target} (not release authorization)")
