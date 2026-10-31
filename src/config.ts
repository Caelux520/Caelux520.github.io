// ============================================================
//  🌸 网站集中配置 (Site Config) — 汇总出口 (Barrel)
// ------------------------------------------------------------
//  ⚠️ 重要说明：
//  本站所有内容仍统一从 `src/config.ts` 提供给我们各页面导入。
//  这里现在是一个「汇总出口」：把拆出去的多个子模块重新导出一遍，
//  让所有页面原来的 `import { xxx } from "../config"` 依旧原样可用~♡
//
//  【内容都搬到哪里了？】
//  ├─ src/config/site.ts        # 站点资料 + 社交链接
//  ├─ src/config/utils.ts       # 计算工具（字数 / 跑站天数）
//  ├─ src/config/posts.ts       # 站点开站日期
//  ├─ src/config/theme.ts       # 主题配色 + 横幅 + 夜间配色
//  ├─ src/config/media.ts       # 播放器歌单 + 今日一言
//  ├─ src/config/lists.ts       # 兴趣 / 壁纸 / 时间线 / 技能 / 项目 / AI 工具 / 友链
//  ├─ src/config/texts.ts       # 聊天气泡 / 公告 / 标语 / 头像说明
//  └─ src/config/sidebar.ts     # 侧栏组件排序配置
//
//  ✅ 以后想改哪类内容，就去对应的子模块改；页面代码完全不用动~
// ============================================================

// ---------- 重新导出各子模块（保持原有导出名不变） ----------
export * from "./config/site";
export * from "./config/utils";
export * from "./config/posts";
export * from "./config/theme";
export * from "./config/media";
export * from "./config/lists";
export * from "./config/texts";
export * from "./config/sidebar";
export * from "./config/live2d";
