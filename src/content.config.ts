import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { DOMAINS, FORMATS } from "./lib/content-model";

const research = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/research" }),
  schema: z.object({
    title: z.string().min(1),
    published: z.coerce.date(),
    domain: z.enum(DOMAINS),
    format: z.enum(FORMATS),
    summary: z.string().min(1).max(240),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { research };
