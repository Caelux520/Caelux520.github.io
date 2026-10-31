import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    desc: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    password: z.string().optional(),
  }),
});

export const collections = { posts };