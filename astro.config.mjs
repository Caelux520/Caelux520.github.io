import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://Caelux520.github.io',
  integrations: [sitemap()],
  // 🚀 站内链接预取：按下瞬间就开始拉下一页，配合 ClientRouter 切页更跟手。
  //    tap = 只在真的要点它时才预取（不像 viewport 那样一屏全拉，省流量）~♡
  prefetch: { prefetchAll: true, defaultStrategy: 'tap' },
});