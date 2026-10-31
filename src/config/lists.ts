// ============================================================
//  🆕 更多页面数据 (对应升级 #5)
//  时间线 / 技能 / 项目 / AI 工具 / 友链 + 兴趣 + 壁纸
// ------------------------------------------------------------
//  从原 config.ts 拆出来的「列表类数据」子模块。
//  · 每个都是独立数组，加一条 = 复制一行，对应页面自动渲染~♡
//  · 想删某页，把对应数组留着空 [] 即可，页面显示空状态~
// ============================================================

// ---------- 💖 兴趣爱好 (Hobbies) ----------
// 想加兴趣卡片：复制 { icon, title, desc } 一行即可
export const hobbies: { icon: string; title: string; desc: string }[] = [
  { icon: "🎮", title: "ACG / 游戏", desc: "喜欢追番和打游戏，享受二次元带来的快乐" },
  { icon: "🎵", title: "音乐",       desc: "日系、电音、摇滚" },
  { icon: "💻", title: "编程",       desc: "前端、后端、二次元站点" },
  { icon: "📷", title: "收藏",       desc: "壁纸、设定图、live 图，收集可爱的一切" },
];

// ---------- 🖼️ 壁纸展示 (Wallpapers / Gallery) ----------
// 「扩展点」：想放壁纸/图片墙，就把图片放到 public/walls/ 目录，
// 然后复制一行 { src, title } 填进去即可。当前先示例为主。
export const walls: { src: string; title: string }[] = [
  // { src: "/walls/1.jpg",  title: "壁纸 1" },
  // { src: "/walls/2.jpg",  title: "壁纸 2" },
];

// ---------- ⏳ 时间线 (Timeline) ----------
// 「扩展点」：复制一行 { date, title, desc } 加一个时间点（新的放上面~♡）
export const timeline: { date: string; title: string; desc: string }[] = [
  { date: "2026-09-20", title: "开始本地装修", desc: "给这个小部屋陆续加了 Markdown、目录、双列网格等玩法~♡" },
  { date: "2026-09-12", title: "建站上线",      desc: "新主页上线，这里成了我在互联网上的小小据点~♡" },
  { date: "2026-09-10", title: "开始学 Astro", desc: "" },
];

// ---------- 🛠️ 技能 (Skills) ----------
// 「扩展点」：复制 { name, level(1~10), icon }；level 决定进度条长度~♡
export const skills: { name: string; level: number; icon: string }[] = [
  { name: "前端 / 网页", level: 7,  icon: "💻" },
  { name: "Astro",       level: 6,  icon: "🚀" },
  { name: "设计 / 审美",  level: 8,  icon: "🎨" },
  { name: "二次元浓度",   level: 10, icon: "✨" },
];

// ---------- 📁 项目 (Projects) ----------
// 「扩展点」：复制 { title, desc, link, icon }；link 留 "" 就不加外链~♡
export const projects: { title: string; desc: string; link: string; icon: string }[] = [
  { title: "本网站 (my-astro-blog)", desc: "一个用 Astro 搭的二次元个人小站~♡", link: "https://github.com/Caelux520", icon: "🌐" },
  { title: "脑洞小项目",             desc: "各种想做的实验性小玩意儿，慢慢折腾~", link: "", icon: "🧪" },
];

// ---------- 🤖 AI 工具 (AI Tools) ----------
// 「扩展点」：复制 { name, desc, link }；link 留 "" 就纯展示~♡
export const aiTools: { name: string; desc: string; link: string }[] = [
  { name: "AstrBot", desc: "用来陪我玩的小助手~", link: "" },
  { name: "大模型们", desc: "写代码 / 查资料 / 开脑洞的好帮手~", link: "" },
  { name: "DeepSeek Harness", desc: "写代码的好帮手~", link: "" },
   { name: "napcat", desc: "一个可爱的 QQ 机器人~", link: "" },
];

// ---------- 🤝 友链 (Friends) ----------
// 「扩展点」：复制 { name, desc, link, avatar? }；avatar 放 public 后填路径~♡
export const friends: { name: string; desc: string; link: string; avatar?: string }[] = [
  { name: "astrbot", desc: "用来陪我玩的小助手~", link: "https://astrbot.app/", avatar: "\\blogroll\\favicon.svg" },
  { name: "napcat", desc: "一个可爱的 QQ 机器人~", link: "https://napneko.github.io/", avatar: "\\blogroll\\napcat.png" },
  { name: "DeepSeek Harness", desc: "写代码的好帮手~", link: "https://www.deepseek.com/harness/", avatar: "\\blogroll\\deepseekharness.png" },
];
