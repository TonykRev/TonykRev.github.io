import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] ?? "dist";
const required = ["index.html", "research/index.html", "search-index.json", "rss.xml", "sitemap-index.xml", "404.html"];
await Promise.all(required.map((path) => access(join(root, path))));
const home = await readFile(join(root, "index.html"), "utf8");
if (!home.includes("Explore the domains")) throw new Error("Homepage is missing the domain index");
if (home.includes("Static and behavioral analysis of a Windows sample")) throw new Error("Removed article dek leaked into homepage output");
console.log("Built-site assertions passed");
