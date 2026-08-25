import { describe, expect, it } from "vitest";
import {
  assertUniqueResearchIds,
  featuredResearch,
  researchByDomain,
  visibleResearch,
} from "../../src/lib/research";
import type { ResearchSummary } from "../../src/lib/content-model";

const entry = (overrides: Partial<ResearchSummary> = {}): ResearchSummary => ({
  id: "sample",
  title: "Sample",
  published: new Date("2026-08-25T00:00:00Z"),
  domain: "cloud-security",
  format: "case-study",
  summary: "Evidence-led sample.",
  tags: ["identity"],
  draft: false,
  featured: false,
  ...overrides,
});

describe("research helpers", () => {
  it("removes drafts and sorts newest first", () => {
    const rows = visibleResearch([
      entry({ id: "old", published: new Date("2026-01-01") }),
      entry({ id: "draft", draft: true, published: new Date("2027-01-01") }),
      entry({ id: "new", published: new Date("2026-08-25") }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["new", "old"]);
  });

  it("requires exactly one visible featured entry", () => {
    expect(() => featuredResearch([entry()])).toThrow("exactly one featured research entry");
    expect(featuredResearch([entry({ featured: true })]).id).toBe("sample");
  });

  it("filters by approved domain", () => {
    expect(researchByDomain([entry()], "cloud-security")).toHaveLength(1);
    expect(researchByDomain([entry()], "malware-dfir")).toHaveLength(0);
  });

  it("rejects case-insensitive research ID collisions", () => {
    expect(() =>
      assertUniqueResearchIds([entry({ id: "Sample" }), entry({ id: "sample" })]),
    ).toThrow("unique ignoring case");
  });
});
