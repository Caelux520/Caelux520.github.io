import { getCollection } from "astro:content";

export async function getPosts() {
  const entries = await getCollection("posts");

  return entries
    .map(({ id, data, body }) => ({
      ...data,
      slug: id,
      date: data.date.toISOString().slice(0, 10),
      content: body,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}