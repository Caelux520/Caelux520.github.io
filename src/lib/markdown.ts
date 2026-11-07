// ============================================================
//  📦 集中式 Markdown 渲染工具 (Markdown Utility)
// ------------------------------------------------------------
//  【作用】全站所有 Markdown 渲染统一走这里，避免各页面各自写一遍。
//  【对应升级】#10 Markdown 增强 —— 支撑正文渲染、提示框、代码块、表格、
//               以及（下一步 #3）文章目录 TOC 所需的标题 id 提取。
//  【扩展点】想加新的提示框类型 / 新规则，都到这里集中改，一处生效全站~
//  【注意】本模块只负责「字符串 → HTML」，不碰布局和组件，避免冲突~♡
// ============================================================

import MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import { createHighlighter } from "shiki";

// ------------------------------------------------------------
//  🎨 代码语法高亮（对应优化：Shiki）
//  · 用 Shiki 给代码围栏做语法高亮。主题用深色的 one-dark-pro，
//  ·  与现有代码块默认深色底一致，明/暗站点模式下都可读~♡
//  ·  【扩展点】想换高亮主题 → 改 createHighlighter 里的 themes 即可~♡
//  ------------------------------------------------------------
// 高亮器在模块顶层初始化（Node ESM 支持 top-level await）。
// 因为 createHighlighter 是异步的，renderMarkdown 也改成 async，
// 需要先保证高亮器就绪，再渲染正文里可能出现的代码块~♡
async function getHL() {
  return createHighlighter({
    themes: ["one-dark-pro"],
    langs: ["js", "ts", "astro", "bash", "html", "css", "glsl", "json", "md", "toml", "yaml", "text"],
  });
}

// ------------------------------------------------------------
//  ✨ 创建 MarkdownIt 实例（集中配置）
//  · html    : 允许正文里写原生 HTML（自己的内容，安全可控）
//  · linkify : 自动把裸链接变成可点击
//  · typographer: 智能标点（可选，开着更优雅）
//  ------------------------------------------------------------
// ------------------------------------------------------------
//  🛠️ 两个自研小工具（不依赖 markdown-it 内部 md.utils）
//  · slugifyHtml：给标题生成稳定的锚点 id（保留中文/英文/数字）
//  · escHtml    ：把标题文本安全转义，避免 XSS / 标签错乱
//  ------------------------------------------------------------
function slugifyHtml(s: string): string {
  const t = (s || "")
    .replace(/<[^>]+>/g, "")     // 先剥掉标题里的行内标签
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-") // 非中英数字 → 连字符
    .replace(/^-+|-+$/g, "");    // 去首尾连字符
  return t || "h";               // 空则给个兜底 id
}

function escHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// ------------------------------------------------------------
//  🏷️ 给每级标题自动加 id（供 TOC 锚点/滚动定位使用）
//  · 用 markdown-it 自带的 slugify 生成稳定 id
//  · 标题带「data-h」标记层级（h2/h3），方便 #3 TOC 过滤
//  【扩展点】想给标题加序号/前缀，在这里统一改即可~♡
//  ------------------------------------------------------------
const defaultHeadingOpen =
  md.renderer.rules.heading_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  // 标题文本：通常在紧邻的 inline token 里
  const inlineToken = tokens[idx + 1];
  const title = (inlineToken && inlineToken.content) || "";
  if (!token.attrGet("id")) {
    token.attrSet("id", slugifyHtml(title) || ("h-" + idx));
  }
  token.attrSet("data-h", String(token.tag || ""));
  return defaultHeadingOpen(tokens, idx, options, env, self);
};

// ------------------------------------------------------------
//  💬 提示框容器（::: note / ::: tip / ::: warning）
//  写法示例：
//    ::: note 📌 提示
//    这里是提示内容，支持**加粗**等 Markdown。
//    :::
//  【扩展点】想加新类型，复制下面一段 block，改类型名+配色即可~♡
//  ------------------------------------------------------------
interface CalloutOpt {
  type: string;       // 提示框类型名（::: 后面跟的名字）
  icon?: string;      // 标题前的小图标（纯文本 emoji/字符）
  title: string;      // 没写自定义标题时用的默认标题
  cls: string;        // 生成的 CSS 类名（和 global.css 里的样式对应）
}

function registerCallout(opt: CalloutOpt): void {
  md.use(container, opt.type, {
    // 校验开头格式：::: type 可选自定义标题
    validate: (params: string) =>
      params.trim().match(new RegExp("^" + opt.type + "\\s+(.*)$")) !== null ||
      params.trim() === opt.type,
    render: (tokens: any[], idx: number) => {
      const m = tokens[idx].info.trim().match(
        new RegExp("^" + opt.type + "\\s+(.*)$"),
      );
      const hasCustom = m && m[1] ? true : false;
      const title = hasCustom ? m[1] : opt.title;
      if (tokens[idx].nesting === 1) {
        // 开头：输出容器 + 标题行（自定义标题直接用不再重复图标；默认标题才带图标~♡）
        return (
          `<div class="callout ${opt.cls}">` +
          `<div class="callout-title">${hasCustom ? "" : (opt.icon ? opt.icon + " " : "")}${escHtml(title)}</div>` +
          `<div class="callout-body">`
        );
      } else {
        // 结尾：闭合容器
        return `</div></div>`;
      }
    },
  });
}

registerCallout({ type: "note", icon: "📌", title: "备注", cls: "callout-note" });
registerCallout({ type: "tip", icon: "💡", title: "提示", cls: "callout-tip" });
registerCallout({ type: "warning", icon: "⚠️", title: "注意", cls: "callout-warning" });

// ------------------------------------------------------------
//  📜 导出统一的渲染函数（含代码块语法高亮）
//  ------------------------------------------------------------
// 代码块高亮：模块级缓存一个 Shiki 高亮器实例（只创建一次，多篇共用~♡）
let _hlCache: Awaited<ReturnType<typeof getHL>> | null = null;
async function getHighlighter() {
  if (!_hlCache) _hlCache = await getHL();
  return _hlCache;
}

// 代码块外壳：包一层「语言标签 + 复制按钮」的头部（对应优化：代码一键复制~♡）
// 复制按钮本身不存原文，点击时由全局脚本读取紧邻 <pre> 的 textContent，避免重复转义~♡
function codeBlock(lang: string, body: string): string {
  return (
    `<div class="code-block">` +
    `<div class="code-head">` +
    `<span class="code-lang">${md.utils.escapeHtml(lang)}</span>` +
    `<button type="button" class="code-copy" aria-label="复制代码">复制</button>` +
    `</div>` +
    body +
    `</div>`
  );
}

// 覆盖 markdown-it 的代码围栏(fence)渲染，用 Shiki 做语法高亮~♡
// 【扩展点】想改代码块行为（如加行号/复制按钮）都改这里~♡
md.renderer.rules.fence = function (tokens, idx) {
  const token = tokens[idx];
  const lang = (token.info || "").trim().split(/\s+/)[0] || "text";
  const code = token.content || "";
  const realLang = (_hlCache && _hlCache.getLoadedLanguages().includes(lang)) ? lang : "text";
  try {
    if (_hlCache) {
      return codeBlock(realLang, _hlCache.codeToHtml(code, { lang: realLang, theme: "one-dark-pro" }));
    }
  } catch {
    /* fall through 到默认渲染 */
  }
  // 兜底：高亮器未就绪或失败时用默认围栏渲染，保证内容不丢~♡
  return codeBlock(realLang,
    `<pre><code class="language-${realLang}">` +
    md.utils.escapeHtml(code) +
    `</code></pre>`
  );
};

// ------------------------------------------------------------
//  🖼️ 正文图片：懒加载 + 点击开灯箱
//  · 包一层 [data-wall-open] 的元素，交给 WallLightbox 组件放大~
//  · 不用 <a> 包裹：图片本身可能已经在链接里（[![](..)](..)），嵌套 <a> 不合法
//  ------------------------------------------------------------
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  token.attrSet("loading", "lazy");
  token.attrSet("decoding", "async");

  const src = String(token.attrGet("src") ?? "");
  // markdown-it 默认的 image 规则会把 children 渲染成 alt 文本，自己写规则就得补回来，
  // 否则输出的是 alt=""（不利于无障碍，灯箱标题也会空~♡
  const alt = String(self.renderInlineAsText(token.children || [], options, env) ?? "").trim();
  token.attrSet("alt", alt);
  const html = self.renderToken(tokens, idx, options);
  if (!src) return html;

  const title = (alt || String(token.attrGet("title") ?? "")).trim();
  return (
    `<span class="md-figure" data-wall-open data-wall-full="${escHtml(src)}"` +
    (title ? ` data-wall-title="${escHtml(title)}"` : "") +
    ` title="点击查看大图" role="button" tabindex="0">${html}</span>`
  );
};

export async function renderMarkdown(content: string): Promise<string> {
  await getHighlighter(); // 先确保高亮器就绪，再渲染（否则 fence 走兜底）~♡
  return md.render(content || "");
}

// ------------------------------------------------------------
//  📑 提取文章标题列表（给 #3 文章目录 TOC 用）
//  返回：[{ id, text, level }] 按出现顺序
//  【说明】本函数当前供下文/下一步 TOC 使用；渲染已默认给标题带 id，
//          所以这里直接从 HTML 里抓 h2/h3 即可~♡
//  ------------------------------------------------------------
export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(html: string): HeadingItem[] {
  const result: HeadingItem[] = [];
  // 只抓 h2 / h3 作为目录层级（h1 是文章大标题，不进目录）
  const re = /<h([23])\s+id="([^"]+)"[^>]*>(.*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    // 把标题里的行内标签（如 <code>、<em>）剥掉，只留纯文本
    const text = (m[3] || "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      result.push({ id: m[2], text, level: Number(m[1]) });
    }
  }
  return result;
}

// 兼容 default export，方便 import 方式灵活
export default md;
