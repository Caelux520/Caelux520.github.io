// ============================================================
//  🔗 文章 URL 尾缀（slug）
//  · 默认用标题生成：保留中文/英文/数字，空格和标点换成 -
//  · 想手动指定就写 frontmatter: slug: my-own-url
//  · 例：我的 Astro 二次元小站折腾笔记
//        → 我的-astro-二次元小站折腾笔记
// ============================================================

export function slugifyPostTitle(input: unknown): string {
  const text = String(input ?? "")
    .normalize("NFKC")          // 全角/半角统一，避免看起来一样、地址却不同
    .trim()
    .toLowerCase()
    .replace(/['’"]/g, "")      // 英文引号不要变成一串横线
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return text || "post";
}
