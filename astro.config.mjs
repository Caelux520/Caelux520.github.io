import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://Caelux520.github.io',
  integrations: [sitemap()],
  // 🚀 站内链接预取：按下瞬间就开始拉下一页，配合 ClientRouter 切页更跟手。
  //    tap = 只在真的要点它时才预取（不像 viewport 那样一屏全拉，省流量）~♡
  prefetch: { prefetchAll: true, defaultStrategy: 'tap' },
  // 🧊 用 esbuild 压缩 CSS：Lightning CSS 会把成对的 backdrop-filter / -webkit-backdrop-filter
  //    去重成只剩 -webkit- 那一行，现代 Chromium 不认这个前缀 → 线上毛玻璃直接失效。
  vite: { build: { cssMinify: 'esbuild' } },
});