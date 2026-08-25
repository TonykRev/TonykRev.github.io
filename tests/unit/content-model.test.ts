import { describe, expect, it } from "vitest";
import { SITE } from "../../src/site.config";

describe("SITE", () => {
  it("uses the approved English identity", () => {
    expect(SITE.language).toBe("en");
    expect(SITE.title).toBe("HSEC");
    expect(SITE.description).toContain("security research");
  });
});
