import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const validator = join(process.cwd(), "scripts/validate-research-content.mjs");
const temporaryDirectories: string[] = [];

function validateFixture(filename: string, contents: string): { status: number; output: string } {
  const directory = mkdtempSync(join(tmpdir(), "research-content-"));
  temporaryDirectories.push(directory);
  writeFileSync(join(directory, filename), contents);

  const result = spawnSync(process.execPath, [validator, directory], { encoding: "utf8" });
  return {
    status: result.status ?? 1,
    output: `${result.stdout}${result.stderr}`,
  };
}

const validFrontmatter = `---
title: "Safe fixture"
published: 2026-08-26
domain: "cloud-security"
format: "case-study"
summary: "A safe fixture."
tags: []
draft: false
featured: false
---`;

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("research content trust validator", () => {
  it("rejects MDX research files", () => {
    const result = validateFixture("unsafe.mdx", `${validFrontmatter}\n\n# Unsafe`);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("only .md files are allowed");
  });

  it("rejects raw HTML in Markdown", () => {
    const result = validateFixture(
      "unsafe.md",
      `${validFrontmatter}\n\n<img src=x onerror=alert(1)>`,
    );

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("raw HTML is not allowed");
  });

  it("rejects an unclosed raw HTML comment", () => {
    const result = validateFixture("unsafe.md", `${validFrontmatter}\n\n<!-- hidden HTML`);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("raw HTML is not allowed");
  });

  it.each(["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)"])(
    "rejects the unsafe URL scheme in %s",
    (destination) => {
      const result = validateFixture(
        "unsafe.md",
        `${validFrontmatter}\n\n[unsafe](${destination})`,
      );

      expect(result.status).not.toBe(0);
      expect(result.output).toContain("unsafe URL scheme");
    },
  );

  it("rejects an unsafe destination after a nested Markdown link label", () => {
    const result = validateFixture(
      "unsafe.md",
      `${validFrontmatter}\n\n[outer [inner]](javascript:alert(1))`,
    );

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("unsafe URL scheme");
  });

  it("rejects frontmatter without an explicit draft flag", () => {
    const result = validateFixture(
      "unsafe.md",
      `${validFrontmatter.replace("\ndraft: false", "")}\n\n# Missing draft`,
    );

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("draft must be explicitly set to true or false");
  });

  it("allows dangerous-looking examples inside fenced code", () => {
    const result = validateFixture(
      "safe.md",
      `${validFrontmatter}\n\n# Safe\n\n\`\`\`html\n<script>alert(1)</script>\n<a href="javascript:alert(1)">example</a>\n\`\`\``,
    );

    expect(result).toMatchObject({ status: 0 });
    expect(result.output).toContain("Validated 1 research Markdown file");
  });
});
