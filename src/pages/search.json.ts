// ============================================================
//  🔍 站内搜索索引（/search.json）
// ------------------------------------------------------------
//  以前把文章列表用 define:vars 内联进「每个页面」的 <script> 里，
//  导致每页 HTML 都多背一份全站文章数据（90KB+）。
//  现在改成单独一个接口：只在第一次点开搜索时才请求，然后缓存在内存里~♡
//
//  📦 索引内容：文章 + 壁纸 + 固定页面。
//     每条统一成 { kind, title, url, ... }，前端只认 url，不再自己拼路径。
//     keywords 只参与匹配、不显示（页面类条目的同义词都放这里）。
//  【扩展点】想让搜索能搜到正文：给文章多带一个 content 字段即可（索引会变大，注意取舍）~♡
// ============================================================
import type { APIContext } from "astro";
import { getPosts } from "../lib/posts";
import { walls } from "../config/lists";

// 🗂️ 固定页面：标题给人看，keywords 给搜索命中（同义词/英文/拼音都行）~♡
const PAGES = [
  { title: "首页",     url: "/",          keywords: "home 主页 开始 欢迎" },
  { title: "关于我",   url: "/about/",    keywords: "about 介绍 自我介绍 站长" },
  { title: "日常瞬间", url: "/moments/",  keywords: "moments 日常 瞬间 动态 说说 时间线" },
  { title: "文章",     url: "/articles/", keywords: "posts 文章 博客 技术 全部文章" },
  { title: "文章档案", url: "/archive/",  keywords: "archive 归档 档案 分类 标签 年表" },
  { title: "兴趣",     url: "/hobbies/",  keywords: "hobbies 爱好 ACG 游戏 音乐 编程" },
  { title: "壁纸",     url: "/walls/",    keywords: "walls 壁纸 图集 图片 收藏" },
  { title: "友链",     url: "/friends/",  keywords: "friends 友情链接 朋友 站点" },
  { title: "时间线",   url: "/timeline/", keywords: "timeline 时间线 历程 大事记" },
  { title: "技能",     url: "/skills/",   keywords: "skills 技能 技术栈 会什么" },
  { title: "项目",     url: "/projects/", keywords: "projects 项目 作品 做过的" },
  { title: "AI 工具",  url: "/ai-tools/", keywords: "ai tools 工具 神器 推荐" },
];

export async function GET(_context: APIContext) {
  const posts = await getPosts();
  const data = [
    ...posts.map((p) => ({
      kind: "post",
      title: p.title,
      url: `/posts/${p.slug}/`,
      category: p.category,
      tags: p.tags || [],
      date: p.date,
    })),
    ...walls.map((w) => ({
      kind: "wall",
      title: w.title,
      url: `/walls/${w.slug}/`,
      category: w.category,
      tags: w.tags || [],
      keywords: [w.desc || "", "壁纸"].join(" "),
    })),
    ...PAGES.map((p) => ({
      kind: "page",
      title: p.title,
      url: p.url,
      keywords: p.keywords,
      tags: [],
    })),
  ];
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 内容会随文章增减变化，交给构建产物决定；这里给个温和缓存~♡
      "Cache-Control": "public, max-age=3600",
    },
  });
}
