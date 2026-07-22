import { defineCollection } from "astro/content/config";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/posts",
  }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
    keywords: z.string(),
    summary: z.string(),
    publishedOn: z.coerce.date().default(() => new Date()),
  }),
});

export const collections = { posts };
