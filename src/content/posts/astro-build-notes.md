---
title: 我的 Astro 二次元小站折腾笔记
slug: "我的-astro-二次元小站折腾笔记"
date: 2026-09-25
desc: 一篇比较长的技术笔记：从零搭一个 Astro 个人小站，顺便展示本地的 Markdown 排版能力（标题、代码块、列表、表格、提示框~♡）。
category: 技术
tags: [Astro, 前端, 日常]
cover: /covers/xixi.jpg
---

这是一篇「长文章」示范~ 用来验证本地的 Markdown 渲染在真实内容下的表现~

## 为什么选 Astro

做个人站点，我试过 VuePress、Hexo，最后还是留在 Astro，原因很朴素：

- 内容驱动，写起来像 Markdown 一样舒服
- 默认静态输出，加载飞快，SEO 友好
- 组件化，公共部分能复用，扩展还灵活
- 生态稳，主题/插件都不少

::: tip 💡 小认识

技术选型不必追最火的，满足自己真实需求才是第一位的。

:::

## 目录结构

这个小站的结构很清爽，所有东西都能一眼找得到:

```text
my-astro-blog/
├─ src/
│  ├─ config.ts        # 站点资料、主题和媒体配置
│  ├─ content/posts/   # Markdown 文章
│  ├─ lib/markdown.ts  # Markdown 渲染工具（集中管理语法扩展）
│  ├─ components/      # 组件：Icon / MusicPlayer / PostCard…
│  ├─ layouts/         # 布局：Layout.astro（三栏+导航+主题切换）
│  └─ pages/           # 首页/关于/归档/兴趣/壁纸/文章…
├─ public/             # 静态资源：图片、音乐…
└─ astro.config.mjs
```

## 集中式配置的精髓

站点资料、主题和媒体配置集中在 config 中，文章则以 Markdown 文件保存。

```md
---
title: 文章标题
date: 2026-09-27
desc: 文章简介
category: 技术
tags: [Astro, 前端]
---

文章正文写在这里，保存到 src/content/posts/ 后会自动生成页面。
```

这样新增文章、换配色、加链接，都不需要修改页面代码，对我这种「只想玩不想掉头发」的人很友好~

## 组件化的好处

公共的「顶部导航」「个人卡」「播放器」这些，全部抽成组件复用，改一处全站生效:

```astro
---
// 一个简单的卡片组件示例
const { title } = Astro.props;
---
<div class="card">
  <h3>{title}</h3>
  <slot />
</div>
```

::: warning ⚠️ 注意

组件命名尽量**避开全局类名**，不然容易出现「样式串台」——比如这次详情页就跟列表卡片撞了类名。

:::

## Markdown 排版一览

这里把常用语法都摆出来:

### 列表

- 无序项：二次元、音乐、编程、收藏
- 缩进嵌套也支持
  - 下一层

1. 有序项一
2. 有序项二

### 引用与分隔

> 纸上得来终觉浅，动手折腾才记得住。

---

### 表格

| 语法 | 说明 |
| --- | --- |
| 标题 / 列表 | 基础排版 |
| 代码块 | 深色代码框 |
| 引用 / 表格 | 引用和表格 |
| 提示框 | ::: note / tip / warning |

### 行内代码

遇到配置项，比如 `astro.config.mjs` 里的 `site`，或代码里的 `renderMarkdown()`，都可以高亮出来。

## 部署到 GitHub Pages

步骤很简单:

1. 项目里配好 `site`: 指向你的 GitHub Pages 地址
2. 把构建产物 `dist/` 推到 gh-pages 分支
3. 域名/动作/缓存按需配置

```bash
npm install && npm run build
# 产物在 dist/ 里，直接推上去即可
```

::: note 📌 备注

本地开发用 `npm run dev`，改完记得重新 build 看看效果，确认没破坏别的页面。

:::

## 遇到的两个小坑

1. **类名撞车** —— 详情页和列表卡片共用了一个类名，导致详情页被拉成横排；后来给详情页换成了独立类名。
2. **markdown-it 版本差异** —— 有的版本没有 `md.utils.slugify`，得自己实现一个 slugify，别直接信任内部 API。

## 后续计划

想慢慢补上这些功能:

- 📚 文章目录 TOC
- 🔍 全文搜索
- 🛠️ 侧栏组件可排序
- 🌍 多语言切换

---

以上就是我的折腾笔记全文~ 也顺便把 Markdown 能用的玩法都演示了一遍~♡