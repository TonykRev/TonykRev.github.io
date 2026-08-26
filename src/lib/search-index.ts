import type { ResearchSummary, SearchRecord } from "./content-model";

export function buildSearchIndex(entries: ResearchSummary[]): SearchRecord[] {
  return entries
    .filter((entry) => !entry.draft)
    .sort((a, b) => b.published.getTime() - a.published.getTime())
    .map(({ id, title, summary, domain, format, tags }) => ({
      id,
      title,
      summary,
      domain,
      format,
      tags,
      url: `/research/${id}/`,
    }));
}
