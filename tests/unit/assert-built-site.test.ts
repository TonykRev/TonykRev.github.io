import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const assertion = join(process.cwd(), "scripts/assert-built-site.mjs");
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("built-site assertions", () => {
  it("accepts a lowercase generated host for a mixed-case configured GitHub owner", () => {
    const directory = mkdtempSync(join(tmpdir(), "built-site-"));
    temporaryDirectories.push(directory);
    mkdirSync(join(directory, "research"));
    for (const path of ["index.html", "research/index.html", "search-index.json", "404.html"]) {
      writeFileSync(join(directory, path), "Explore the domains", "utf8");
    }
    writeFileSync(join(directory, "rss.xml"), "https://tonykrev.github.io/research/", "utf8");
    writeFileSync(join(directory, "sitemap-index.xml"), "https://tonykrev.github.io/sitemap-0.xml", "utf8");

    const result = spawnSync(process.execPath, [assertion, directory], {
      encoding: "utf8",
      env: { ...process.env, SITE_URL: "https://TonykRev.github.io" },
    });

    expect(result.status).toBe(0);
  });
});
