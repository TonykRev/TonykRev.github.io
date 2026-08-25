import type { Domain, ResearchSummary } from "./content-model";

export function visibleResearch(entries: ResearchSummary[]): ResearchSummary[] {
  return entries
    .filter((entry) => !entry.draft)
    .sort((a, b) => b.published.getTime() - a.published.getTime());
}

export function featuredResearch(entries: ResearchSummary[]): ResearchSummary {
  const featured = visibleResearch(entries).filter((entry) => entry.featured);

  if (featured.length !== 1) {
    throw new Error("Expected exactly one featured research entry");
  }

  return featured[0];
}

export function researchByDomain(entries: ResearchSummary[], domain: Domain): ResearchSummary[] {
  return visibleResearch(entries).filter((entry) => entry.domain === domain);
}

export function assertUniqueResearchIds(entries: ResearchSummary[]): void {
  const normalized = entries.map((entry) => entry.id.toLocaleLowerCase("en"));

  if (new Set(normalized).size !== normalized.length) {
    throw new Error("Research IDs must be unique ignoring case");
  }
}
