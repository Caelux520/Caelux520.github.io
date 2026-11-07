import { getCollection } from "astro:content";
import { slugifyPostTitle } from "./slug";

export async function getPosts() {
  const entries = await getCollection("posts");

  const posts = entries
    .filter(({ data }) => !data.draft)
    .map(({ id, data, body, filePath }) => {
      // 注意：frontmatter 写了 slug 时，content collection 的 id 会变成 slug，
      // 所以旧文件名要从 filePath 里取，不能直接拿 id。
      const fileName = (filePath || id).replace(/\\/g, "/").split("/").pop() || id;
      const legacySlug = fileName.replace(/\.mdx?$/i, "");

      return {
        ...data,
        // 旧地址（文件名）先留着：构建时给老链接生成一个跳转页，
        // 已经分享出去的 /posts/old-file-name/ 不会直接 404。
        legacySlug,
        date: data.date.toISOString().slice(0, 10),
        content: body,
      };
    })
    // 先排序再分配 slug：标题重复时，谁拿到 -2 是稳定的。
    .sort((a, b) => b.date.localeCompare(a.date) || a.legacySlug.localeCompare(b.legacySlug));

  const used = new Set<string>();

  return posts.map((post) => {
    // frontmatter 里写了 slug 就用它；没写就用文章标题自动生成。
    // 例：我的 Astro 二次元小站折腾笔记 → 我的-astro-二次元小站折腾笔记
    const custom = (post as { slug?: unknown }).slug;
    const base = slugifyPostTitle(
      typeof custom === "string" && custom.trim() ? custom : post.title
    );

    let slug = base;
    let suffix = 2;
    while (used.has(slug)) slug = `${base}-${suffix++}`;
    used.add(slug);

    return { ...post, slug };
  });
}
