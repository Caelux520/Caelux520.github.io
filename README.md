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
├─ pages/            # 路由：首页、文章、归档、壁纸、友链…
│  ├─ posts/[slug].astro   # 文章详情（TOC / 阅读进度 / 加密演示）
│  ├─ rss.xml.ts           # RSS
│  └─ search.json.ts       # 站内搜索索引（按需请求）
├─ layouts/Layout.astro    # 全站外壳：导航、侧栏、主题、加载层
├─ components/       # 播放器、Live2D、Toast、图标…
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

## 部署

`.github/workflows/deploy.yml` 负责构建并发布到 GitHub Pages：

1. 仓库 `Settings → Pages → Source` 选择 **GitHub Actions**
2. 推送 `main` 触发：`npm ci` → `npm run check` → `npm run build` → 发布 `dist/`

如果不想让每次推送都上线，把 `deploy.yml` 里的 `on.push` 删掉、只保留 `workflow_dispatch`，发布就变成手动操作。

## 注意

- `public/music/` 里有 4 首 mp3（约 39MB），会随仓库一起分发；在意仓库体积的话建议压缩码率或改走外部存储。
- 站点默认语言为 `zh-CN`，RSS 与 sitemap 在构建时生成。
