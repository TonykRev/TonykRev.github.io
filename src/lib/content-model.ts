export const DOMAINS = ["malware-dfir", "cloud-security", "security-engineering"] as const;
export const FORMATS = ["deep-research", "case-study", "guide"] as const;

export type Domain = (typeof DOMAINS)[number];
export type ResearchFormat = (typeof FORMATS)[number];

export interface ResearchSummary {
  id: string;
  title: string;
  published: Date;
  domain: Domain;
  format: ResearchFormat;
  summary: string;
  tags: string[];
  draft: boolean;
  featured: boolean;
}
