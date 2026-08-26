import { describe, expect, it } from "vitest";
import { buildSearchIndex } from "../../src/lib/search-index";
import type { ResearchSummary } from "../../src/lib/content-model";

const entry: ResearchSummary = {
  id: "identity-case",
  title: "Identity case",
  published: new Date("2026-08-25T00:00:00Z"),
  domain: "cloud-security",
  format: "case-study",
  summary: "An evidence-led identity investigation.",
  tags: ["identity", "detection"],
  draft: false,
  featured: false,
};

describe("buildSearchIndex", () => {
  it("maps visible research into stable public records", () => {
    expect(buildSearchIndex([entry])).toEqual([
      {
        id: "identity-case",
        title: "Identity case",
        summary: "An evidence-led identity investigation.",
        domain: "cloud-security",
        format: "case-study",
        tags: ["identity", "detection"],
        url: "/research/identity-case/",
      },
    ]);
  });

  it("omits drafts", () => {
    expect(buildSearchIndex([{ ...entry, id: "draft", draft: true }])).toEqual([]);
  });
});
