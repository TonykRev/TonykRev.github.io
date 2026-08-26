import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { DOMAINS, FORMATS } from "./lib/content-model";

const research = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/research" }),
  schema: z.object({
    title: z.string().min(1),
    published: z.coerce.date(),
    domain: z.enum(DOMAINS),
    format: z.enum(FORMATS),
    summary: z.string().min(1).max(240),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { research };
