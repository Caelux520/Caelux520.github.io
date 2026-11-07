# いんしゅん の部屋

一个 Astro 静态博客：二次元风格的个人主页，包含文章、归档、壁纸墙、友链、时间线、Live2D 看板娘和常驻音乐播放器。

- 线上地址：<https://caelux520.github.io/>
- 纯静态输出，构建产物在 `dist/`

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Astro 7（static 输出） |
| 内容 | Astro Content Collections + Markdown（markdown-it） |
| 样式 | 原生 CSS（`src/styles/global.css`），无 UI 框架 |
| 订阅 | `@astrojs/rss` + `@astrojs/sitemap` |
| 部署 | GitHub Actions → GitHub Pages |

> 🎨 改配色只改 `src/styles/global.css` 顶部两个块：`:root`（亮色）和 `html.dark`（暗色）。
> `--accent` 是链接/按钮这类小面积元素；`--accent-deep` 是给大字号和头像气泡用的低饱和版本（久看不刺眼）。

## 快速开始

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev        # 本地开发，http://localhost:4321/
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
npm run check      # Astro / TypeScript 类型检查
npm run smoke      # 冒烟测试：无头浏览器真实点击，验证路由与布局
```

`npm run smoke` 会优先复用已在运行的 4321 端口，否则自己起 `astro preview`；需要本机装有 Edge 或 Chrome。

## 目录结构

```
src/
├─ pages/            # 路由：首页、瞬间、档案、壁纸、友链…
│  ├─ moments.astro        # 日常瞬间（时间线，日常类文章）
│  ├─ articles/[...page].astro # 文章（带封面的大卡片，分页：一页 6 篇）
│  ├─ archive.astro        # 文章档案（按年份/分类/标签分组，技术类文章）
│  ├─ posts.astro          # 旧的 /posts/ 列表页 → 自动跳到 /articles/
│  ├─ posts/[slug].astro   # 文章详情（TOC / 阅读进度 / 加密演示）
│  ├─ rss.xml.ts           # RSS
│  └─ search.json.ts       # 站内搜索索引（按需请求）
├─ layouts/Layout.astro    # 全站外壳：导航、侧栏、主题、加载层
├─ components/       # 播放器、Live2D、Toast、档案条目、分页、相关文章、壁纸灯箱…
├─ content/posts/    # Markdown 文章
├─ config/           # 站点资料 / 主题 / 歌单 / 友链等集中配置
├─ lib/              # Markdown 渲染、文章查询、Live2D、Toast
└─ styles/global.css # 全站样式
public/              # 原样拷贝的静态资源（头像、封面、音乐、Live2D）
scripts/smoke.mjs    # 冒烟测试脚本
```

## 写文章

在 `src/content/posts/` 新建 `my-note.md`，地址就是 `/posts/my-note/`。

```md
---
title: 文章标题
date: 2026-11-01
desc: 列表和分享卡片里显示的简介
category: 技术
tags: [Astro, 前端]
cover: /covers/my-note.jpg
draft: false
---

正文从这里开始。
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 文章标题 |
| `date` | ✅ | 发布日期，`YYYY-MM-DD` |
| `desc` | ✅ | 摘要，用于列表、SEO 和分享卡片 |
| `category` | ✅ | 分类，归档页会自动汇总 |
| `tags` | | 标签数组 |
| `cover` | | 封面，放在 `public/` 下并用 `/` 开头的路径引用 |
| `password` | | 仅前端演示锁，**不能**保护真正的私密内容 |
| `draft` | | `true` 时不出现在列表 / 归档 / RSS / 搜索里，也不生成详情页 |

新增文件后，列表、详情页、RSS、搜索索引都会自动更新，不需要手动登记。

### 正文里的图片

直接写 `![说明](/图片路径.jpg)`，会自动懒加载 + 点开灯箱。完整说明见 [`src/content/README.md`](src/content/README.md)（写文章的详细须知都在那份文档里）。

## 两个内容版块：日常瞬间 / 文章档案

站内内容分成两个并列的版块，不是一个列表加两排筛选：

| 地址 | 版块 | 长得像什么 |
|---|---|---|
| `/moments/` | **日常瞬间** | 左边日期牌 + 时间线，右边是卡片（标题 / 简介 / 封面 / 标签），轻一点 |
| `/articles/` | **文章** | 带封面的大卡片列表，一页 6 篇，底部有 1 2 3 页码（第 2 页起是 `/articles/2/`） |
| `/archive/` | **文章档案** | 分段控件切换「按年份 / 按分类 / 按标签」，下面是一行行紧凑的档案条目，年份组可以折叠 |

「文章」和「文章档案」是同一批正式长文的两种看法（卡片视图 / 索引视图），日常的碎碎念只在「日常瞬间」。

`/posts/<slug>/` 还是文章详情页，`/posts/` 这个旧地址会自动跳到 `/articles/`。

哪个分类去哪一边，由 `src/config/postGroups.ts` 决定：里面写着每个版块收哪些 `category`。
想让新分类归到某一边，把分类名加进对应版块的 `categories` 数组就行，页面不用改；
没匹配上的分类默认算「日常瞬间」。侧栏的「分类 / 标签」卡片会自动跳到它所在的那一边。

## 配置

站点内容集中在 `src/config/`，页面只从 `src/config.ts` 这个汇总出口导入：

| 文件 | 内容 |
|---|---|
| `site.ts` | 站名、头像、社交链接 |
| `theme.ts` | 主题色、横幅、夜间配色 |
| `media.ts` | 播放器歌单、今日一言 |
| `lists.ts` | 兴趣 / 壁纸 / 时间线 / 技能 / 项目 / 友链 |
| `texts.ts` | 聊天气泡、公告、标语 |
| `live2d.ts` | 看板娘模型与位置 |
| `sidebar.ts` | 侧栏组件排序 |
| `postGroups.ts` | 文章分区（日常 / 技术）与分类归属 |

## 部署

`.github/workflows/deploy.yml` 负责构建并发布到 GitHub Pages：

1. 仓库 `Settings → Pages → Source` 选择 **GitHub Actions**
2. 推送 `main` 触发：`npm ci` → `npm run check` → `npm run build` → 发布 `dist/`

如果不想让每次推送都上线，把 `deploy.yml` 里的 `on.push` 删掉、只保留 `workflow_dispatch`，发布就变成手动操作。

## Live2D 看板娘

左下角的看板娘跑在同源 iframe（`/live2d/host.html`）里，主页面只负责传配置、收事件。

- 模型在 `public/live2d/models/noir/`，是 **NOIR**：`noir.moc3` 993KB + 1 张 2048 贴图（已转 WebP，1.9MB → 304KB），带 4 个表情，整套约 1.3MB
- ⚠️ **大肥鱼（DeepSeek-chan）放进来会花脸**：它是 Cubism 5 导出的 moc3（文件头版本 5），而站上这份 `l2d-widget.min.js` 是较旧的构建，渲染 v5 模型时下半张脸会糊成一片。想用 Cubism 5 模型，得先把 widget 升到上游 [hacxy/l2d-widget](https://github.com/hacxy/l2d-widget)（MIT，已支持 Cubism 3/4/5）
- 开了省流量模式（`saveData`）或 2G 网络时会直接跳过加载
- 换模型：把模型文件夹放进 `public/live2d/models/<名字>/`，改 `src/config/live2d.ts` 里 `models[0].path`
- 位置 / 大小 / 台词 / 菜单都在 `src/config/live2d.ts`；`enabled: false` 可整体关掉
- **气泡只有一个**：台词统一由主页面那个 `.l2d-bubble` 显示，widget 自带的 tips 气泡在 `driver.ts` 里被显式关成 `tips: false`（传空数组没用，它照样会建一个空框，在头顶留个小紫块）
- 模型 18 秒内没加载出来会自动隐藏（并打印警告），不会留一个透明的空框
- 窄屏会等比缩小，1280px 以下不显示
- **视线跟随整个视口**：widget 原生只认自己那块画布，`driver.ts` 里把页面坐标归一化后合成 `mousemove` 丢进 iframe，鼠标在页面任何位置她都会看过去
- **点一下说一句**，2.5 秒冷却（`TAP_COOLDOWN`），连点不会刷屏；台词每 25 秒自动冒一句
- **睡眠状态只记在内存里**：站内切页面回来她还是睡着的，但刷新 / 新开标签一律恢复清醒（点「正在休息」或按快捷键 `l` 可以叫醒/哄睡）

## 注意

- `public/music/` 里有 5 首 mp3（约 20MB，已从 320kbps 重压到 128kbps），会随仓库一起分发；还想再小的话可以换 96kbps 或走外部存储。
- `public/live2d/` 含看板娘 NOIR（约 1.3MB）和 660KB 的 widget 脚本；旧模型 `models/hiyori/` 已经删掉，需要时从 Live2D 官方示例重新下载即可。
- 站点默认语言为 `zh-CN`，RSS 与 sitemap 在构建时生成。
