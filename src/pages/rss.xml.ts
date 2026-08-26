import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../site.config";

export async function GET(context: { site?: URL }) {
  const entries = (await getCollection("research", ({ data }) => !data.draft)).sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? new URL("http://localhost:4321"),
    items: entries.map(({ id, data }) => ({ title: data.title, description: data.summary, pubDate: data.published, link: `/research/${id}/` })),
  });
}
