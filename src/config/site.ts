// ============================================================
//  🌸 基本资料 (Basic Info) + 社交链接 (Social Links)
// ------------------------------------------------------------
//  从原 config.ts 拆出来的「站点资料」子模块。
//  想改头像、名字、标语、加社交链接，都改这里即可~♡
// ============================================================

// ---------- 🔮 基本资料 (Basic Info) ----------
export const site = {
  // 主标题（显示的大名字）
  name: "いんしゅん",
  // 副标题 / 中文名（可留空 "" 就不显示）
  alias: "Caelux",
  // 一句话标语（个人简介，支持一点点换行）
  tagline: "二次元爱好者 · 代码与动画的造梦者",
  // 头像图片路径（放在 public/ 目录下，比如 public/awa.jpg → "/awa.jpg"）
  avatar: "/awa.jpg",
  // 鼠标悬停在标签页标题上 / 页面标题后缀
  pageTitle: "いんしゅん の部屋",
};

// ---------- 🔗 社交链接 (Social Links) ----------
// 想加/减社交按钮：复制一个 { ... }，改 name / url / icon 即可
// icon 填品牌名 key：github / bilibili / twitter / discord（在 Layout.astro 里映射成标准品牌 logo~♡）
//
// 【「还没做」的项怎么写？】
//   · 写 url  → 正常跳转（新标签页打开）
//   · 不写 url → 这一项变成「敬请期待」按钮：点击不跳转，
//                而是在页面顶部弹一个小提示窗（逻辑在 src/lib/toast.ts）~♡
//   提示文案：
//     不写 soon → 默认「×× 还没弄好哦~ 敬请期待~♡」
//     写了 soon → 用你自己的那句（想说清楚为什么还没有，就用这个）
//
// ✨ 以后要开放哪一项，直接给它补上 url 即可，别的都不用动~♡
export type SocialLink = {
  /** 显示名 */
  name: string;
  /** 品牌图标 key（见上面的 brandIcons） */
  icon: string;
  /** 真实地址。留空 / 不写 = 还没开放，点了只弹提示~♡ */
  url?: string;
  /** 没开放时点击弹的文案（可选，不写用默认那句）~♡ */
  soon?: string;
};

export const socials: SocialLink[] = [
  { name: "GitHub", url: "https://github.com/Caelux520", icon: "github" },
  { name: "B站", url: "https://space.bilibili.com/1375913560", icon: "bilibili" },
  // 🌱 下面两个还没弄好 → 不写 url，点击只弹提示、不会跳到官网去~♡
  { name: "Twitter/X", icon: "twitter" },
  {
    name: "Discord",
    icon: "discord",
    soon: "Discord 小屋还在搭~ 弄好了会第一时间挂上去~♡",
  },
];
