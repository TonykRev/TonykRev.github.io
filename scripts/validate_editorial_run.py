from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REQUIRED_ARTIFACTS = {
    "01-research-brief.md": {"phase": "research-brief", "generated_by": "research_planner"},
    "02-evidence-ledger.md": {"phase": "evidence-ledger", "generated_by": "evidence_verifier"},
    "03-draft.md": {"phase": "draft", "generated_by": "technical_writer"},
    "04-security-review.md": {"phase": "security-review", "generated_by": "security_reviewer"},
    "05-site-qa.md": {"phase": "site-qa", "generated_by": "site_qa"},
    "06-release-report.md": {"phase": "release-report", "generated_by": "root"},
}
REQUIRED_METADATA = ("topic", "slug", "phase", "status", "generated_by")
VALID_STATUSES = {"complete", "blocked"}
VALID_REVIEW_DECISIONS = {"PASS", "BLOCKED"}
VALID_RELEASE_DECISIONS = {"READY FOR HUMAN REVIEW", "BLOCKED"}
REQUIRED_QA_COMMANDS = {
    "npm test",
    "npm run check",
    "npm run build",
    "npm run test:built",
    "npm run test:links",
    "npm run test:e2e",
    "npm run test:lighthouse",
}
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


def section_contents(body: str, heading: str) -> list[str]:
    matches = list(re.finditer(rf"(?m)^# {re.escape(heading)}[ \t]*$", body))
    sections: list[str] = []
    for heading_match in matches:
        next_heading = re.search(r"(?m)^# ", body[heading_match.end() :])
        end = heading_match.end() + (next_heading.start() if next_heading else len(body[heading_match.end() :]))
        sections.append(body[heading_match.end() : end].strip())
    return sections


def unique_section(filename: str, body: str, heading: str, errors: list[str]) -> str | None:
    sections = section_contents(body, heading)
    if len(sections) > 1:
        errors.append(f"{filename}: duplicate {heading} section")
        return None
    return sections[0] if sections else None


def validate_decision(filename: str, body: str, heading: str, allowed: set[str], errors: list[str]) -> str | None:
    decision = unique_section(filename, body, heading, errors)
    if decision not in allowed:
        choices = ", ".join(sorted(allowed))
        errors.append(f"{filename}: {heading.lower()} must be one of: {choices}")
        return None
    return decision


def qa_command_evidence(commands: str) -> list[tuple[str, int, str]]:
    lines = [line.strip() for line in commands.splitlines() if line.strip().startswith("|")]
    for index, line in enumerate(lines):
        headers = [cell.strip().lower() for cell in line.strip("|").split("|")]
        if "command" not in headers or "exit status" not in headers or "result" not in headers:
            continue
        command_index = headers.index("command")
        exit_index = headers.index("exit status")
        result_index = headers.index("result")
        evidence: list[tuple[str, int, str]] = []
        for row in lines[index + 1 :]:
            cells = [cell.strip() for cell in row.strip("|").split("|")]
            if all(re.fullmatch(r"[: -]+", cell) for cell in cells):
                continue
            if len(cells) <= max(command_index, exit_index, result_index) or not cells[command_index]:
                continue
            try:
                exit_status = int(cells[exit_index])
            except ValueError:
                return []
            command = cells[command_index].strip("`")
            evidence.append((command, exit_status, cells[result_index]))
        return evidence
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
            issues = unique_section(filename, body, "Blocking issues", errors)
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

    statuses = {filename: metadata.get("status") for filename, (metadata, _) in parsed_artifacts.items()}
    security_decision: str | None = None
    qa_decision: str | None = None

    security = parsed_artifacts.get("04-security-review.md")
    if security:
        security_decision = validate_decision("04-security-review.md", security[1], "Decision", VALID_REVIEW_DECISIONS, errors)
        if security_decision == "PASS" and statuses.get("04-security-review.md") != "complete":
            errors.append("04-security-review.md: PASS decision requires complete status")
        if security_decision == "BLOCKED" and statuses.get("04-security-review.md") != "blocked":
            errors.append("04-security-review.md: BLOCKED decision requires blocked status")

    qa = parsed_artifacts.get("05-site-qa.md")
    if qa:
        qa_decision = validate_decision("05-site-qa.md", qa[1], "Decision", VALID_REVIEW_DECISIONS, errors)
        if qa_decision == "PASS":
            commands = unique_section("05-site-qa.md", qa[1], "Commands", errors)
            evidence = qa_command_evidence(commands) if commands is not None else []
            if not evidence or any(code != 0 or not result for _, code, result in evidence):
                errors.append("05-site-qa.md: PASS decision requires command and exit-status evidence")
            command_names = [command for command, _, _ in evidence]
            if set(command_names) != REQUIRED_QA_COMMANDS or len(command_names) != len(REQUIRED_QA_COMMANDS):
                errors.append("05-site-qa.md: PASS decision requires the complete approved QA command set")
            if statuses.get("05-site-qa.md") != "complete":
                errors.append("05-site-qa.md: PASS decision requires complete status")
        elif qa_decision == "BLOCKED" and statuses.get("05-site-qa.md") != "blocked":
            errors.append("05-site-qa.md: BLOCKED decision requires blocked status")

    release = parsed_artifacts.get("06-release-report.md")
    if release:
        body = release[1]
        release_security = validate_decision("06-release-report.md", body, "Security decision", VALID_REVIEW_DECISIONS, errors)
        release_qa = validate_decision("06-release-report.md", body, "QA decision", VALID_REVIEW_DECISIONS, errors)
        release_decision = validate_decision("06-release-report.md", body, "Release decision", VALID_RELEASE_DECISIONS, errors)
        if release_security and security_decision and release_security != security_decision:
            errors.append("06-release-report.md: security decision does not match 04-security-review.md")
        if release_qa and qa_decision and release_qa != qa_decision:
            errors.append("06-release-report.md: QA decision does not match 05-site-qa.md")
        if release_decision == "READY FOR HUMAN REVIEW":
            if any(status != "complete" for status in statuses.values()):
                errors.append("06-release-report.md: READY FOR HUMAN REVIEW requires every artifact to be complete")
            if security_decision != "PASS" or qa_decision != "PASS":
                errors.append("06-release-report.md: READY FOR HUMAN REVIEW requires PASS security and QA decisions")
        if release_decision == "BLOCKED" and statuses.get("06-release-report.md") != "blocked":
            errors.append("06-release-report.md: BLOCKED decision requires blocked status")
        if unique_section("06-release-report.md", body, "Publish authorization", errors) != "NOT GRANTED":
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
