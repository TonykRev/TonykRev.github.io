import { getCollection } from "astro:content";
import { assertUniqueResearchIds } from "../lib/research";
import { buildSearchIndex } from "../lib/search-index";

export async function GET() {
  const collection = await getCollection("research");
  const entries = collection.map(({ id, data }) => ({ id, ...data }));
  assertUniqueResearchIds(entries);
  return new Response(JSON.stringify(buildSearchIndex(entries)), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
