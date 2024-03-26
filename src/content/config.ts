import { z, defineCollection } from "astro:content";

const postCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
    keywords: z.string(),
    // image: z.string().optional(),
    summary: z.string(),
    publishedOn: z.date().default(() => new Date()),
  }),
});

export const collections = {
  posts: postCollection,
};
