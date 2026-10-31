// ============================================================
//  🔍 站内搜索索引（/search.json）
// ------------------------------------------------------------
//  以前把文章列表用 define:vars 内联进「每个页面」的 <script> 里，
//  导致每页 HTML 都多背一份全站文章数据（90KB+）。
//  现在改成单独一个接口：只在第一次点开搜索时才请求，然后缓存在内存里~♡
//  【扩展点】想让搜索能搜到正文：下面多带一个 content 字段即可（索引会变大，注意取舍）~♡
// ============================================================
import type { APIContext } from "astro";
import { getPosts } from "../lib/posts";

export async function GET(_context: APIContext) {
  const posts = await getPosts();
  const data = posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    category: p.category,
    tags: p.tags || [],
    date: p.date,
  }));
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 内容会随文章增减变化，交给构建产物决定；这里给个温和缓存~♡
      "Cache-Control": "public, max-age=3600",
    },
  });
}
