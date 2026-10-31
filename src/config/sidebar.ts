// ============================================================
//  🧩 侧栏组件配置 (对应升级 #12) — 可排序 / 可开关~♡
// ------------------------------------------------------------
//  从原 config.ts 拆出来的「布局配置」子模块。
//  · left  : 左侧栏显示哪些卡片、按什么顺序
//  · right : 右侧栏显示哪些卡片、按什么顺序
//  · 每个 key 对应 Layout.astro 里已定义的一种卡片：
//      left 可选: "profile"(个人卡) / "quote"(今日一言) / "socials"(社交)
//      right 可选: "announcement"(公告) / "stats"(统计) / "tags"(标签云) / "categories"(分类)
//  【扩展点】
//    · 想开关某卡片：把它从数组里删掉（或改顺序）即可，页面布局自动跟随~♡
//    · 想加新卡片类型：先在 Layout.astro 里加一个 if(key === "xxx") 渲染分支，
//      再把 "xxx" 填进下面的数组即可~♡
// ============================================================
export const sidebarConfig: { left: string[]; right: string[] } = {
  left:  ["profile", "quote", "socials"],
  right: ["announcement", "stats", "tags", "categories"],
};
