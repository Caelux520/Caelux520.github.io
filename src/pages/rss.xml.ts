// ============================================================
//  📡 RSS Feed（/rss.xml）— 对应优化“SEO 三件套”
//  · 从 Astro Content Collections 生成，新增 Markdown 文章自动收录~♡
//  · 用 Astro 自带的 rss() 工具拼 XML，链接走 site 域名（astrco.config.mjs）
//  【扩展点】想改 feed 标题/描述 → 改下面 title/description 即可~♡
// ============================================================
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../lib/posts";
import { renderMarkdown } from "../lib/markdown";

// 全文订阅：description 里放「摘要 + 完整正文（Markdown 渲染后的 HTML）」，
// 阅读器里能直接看全文，比只有摘要体验好很多~♡
export async function GET(context: APIContext) {
  const posts = await getPosts();
  const items = await Promise.all(
    posts
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map(async (p) => ({
        title: p.title,
        pubDate: new Date(p.date),
        // 链接/ guid：统一指向文章详情页 /posts/<slug>/~♡
        link: `/posts/${p.slug}/`,
        guid: `/posts/${p.slug}/`,
        // 描述 = 摘要 + 完整正文（shiki 高亮在 build 时算好，读者不用等~♡）
        description: (p.desc ? p.desc + "\n" : "") + (await renderMarkdown(p.content || "")),
        categories: p.tags || [],
      })),
  );
  return rss({
    // Feed 标题 / 描述 / 站点地址（context.site 来自 astro.config.mjs 的 site~♡）
    title: "いんしゅん の部屋",
    description: "二次元爱好者的部屋 ~ 兴趣、壁纸收藏与偶尔的日志~♡",
    site: context.site ?? new URL("https://Caelux520.github.io"),
    // 浏览器直接打开 /rss.xml 时用这份样式渲染成网页（阅读器忽略它）~♡
    stylesheet: "/rss.xsl",
    items,
  });
}
