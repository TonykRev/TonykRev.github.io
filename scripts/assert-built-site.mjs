import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] ?? "dist";
const required = ["index.html", "research/index.html", "search-index.json", "rss.xml", "sitemap-index.xml", "404.html"];
await Promise.all(required.map((path) => access(join(root, path))));
const home = await readFile(join(root, "index.html"), "utf8");
if (!home.includes("Explore the domains")) throw new Error("Homepage is missing the domain index");
if (home.includes("Static and behavioral analysis of a Windows sample")) throw new Error("Removed article dek leaked into homepage output");
const expectedOrigin = process.env.SITE_URL;
if (expectedOrigin) {
  const normalizedOrigin = expectedOrigin.replace(/\/$/, "");
  const [rss, sitemapIndex] = await Promise.all([
    readFile(join(root, "rss.xml"), "utf8"),
    readFile(join(root, "sitemap-index.xml"), "utf8"),
  ]);
  if (!rss.includes(`${normalizedOrigin}/research/`)) throw new Error("RSS does not use the configured production origin");
  if (!sitemapIndex.includes(`${normalizedOrigin}/sitemap-`)) throw new Error("Sitemap index does not use the configured production origin");
}
console.log("Built-site assertions passed");
