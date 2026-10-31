# 写文章

在 `src/content/posts/` 新建一个 `.md` 文件，文件名会成为文章地址。例如 `my-note.md` 对应 `/posts/my-note/`。

在文件顶部填写文章信息，空行后写 Markdown 正文：

```md
---
title: 文章标题
date: 2026-09-27
desc: 列表和分享卡片中显示的简介
category: 随笔
tags:
  - 日常
cover: /covers/my-note.jpg
---

从这里开始写正文。
```

封面图片放在 `public/` 下，再填写以 `/` 开头的站点路径；`cover` 和 `tags` 都可以省略。文章标题、日期、简介和分类为必填项。分类和标签会自动汇总到归档筛选与侧栏。

新增文件后，Astro 会自动生成列表项、详情页、站内搜索数据和 RSS 条目。密码字段仅用于现有的前端演示锁，不能保护真正的私密内容。