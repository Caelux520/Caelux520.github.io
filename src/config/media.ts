// ============================================================
//  🎵 播放器歌单 (Music Player) + 💬 今日一言 (Daily Quote)
// ------------------------------------------------------------
//  从原 config.ts 拆出来的「媒体/随感」子模块~♡
// ============================================================

// ---------- 🎵 播放列表 (Music Player) ----------
//  【扩展点】想加一首歌 = 复制一行 { title, artist, url, cover } 填好即可~♡
//  · title/artist：歌名 / 作者（会在迷你条和歌单显示~♡）
//  · url：音频路径，需把文件放进 public/music/ 后填 "/music/文件名.mp3"~♡
//    （文件名里有空格的话，URL 里要用 %20 代替空格~♡）
//  · cover：封面图路径（public/music/ 下的 jpg/webp），留空用默认唱片~♡
//  ============================================================
export const music: { title: string; artist: string; url: string; cover: string }[] = [
  // cover：封面图地址（放 public/ 后填 "/xxx.jpg"），留空会用默认唱片图案~♡
  { title: "Falling Again",      artist: "NURKO & Roniit", url: "/music/Falling%20Again-NURKO_Roniit.mp3",  cover: "/music/Falling%20Again-NURKO_Roniit.jpg"  },
  { title: "STYX HELIX",         artist: "MYTH & ROID",   url: "/music/STYX%20HELIX-MYTH%20ROID.mp3",       cover: "/music/STYX%20HELIX-MYTH%20ROID.webp" },
  { title: "嘘月", artist: "ヨルシカ",    url: "/music/嘘月-ヨルシカ.mp3",            cover: "/music/嘘月-ヨルシカ.jpg" },
  { title: "小さな海",      artist: "結束バンド",      url: "/music/小さな海-結束バンド.mp3",                cover: "/music/小さな海-結束バンド.jpg" },
   { title: "老人と海",      artist: "ヨルシカ",      url: "/music/老人と海-ヨルシカ.mp3",                cover: "/music/老人と海-ヨルシカ.jpg" },
];

// ---------- 💬 今日一言 (Daily Quote / 侧栏小卡) ----------
// 按「一年中的第几天」轮换：同一天不变，隔天自动换一句。
// 条数越多，重复得越慢（现在 18 条，约两周不重样）。
export const quotes: string[] = [
  "今天也要元气满满哦~♡",
  "代码写累了就看看可爱的壁纸吧~",
  "二次元的快乐，是三分钟就能续上的~♡",
  "慢慢来，比较快。",
  "今天的主人也要好好宠我一天哦~嘻嘻~♡",
  "把生活过成喜欢的颜色~",
  "写不出来的时候，就去倒杯水吧。",
  "今天的风，好像有点像动画里的那种。",
  "收藏夹里的东西，总有一天会用上的（吧）。",
  "别忘了抬头看看窗外，世界还在转呢~",
  "喜欢的东西，大大方方地喜欢就好。",
  "做完一件事，就奖励自己一小会儿发呆。",
  "睡个好觉，比什么灵感都管用。",
  "偶尔翻翻旧文章，会发现以前的自己还挺可爱。",
  "今天也辛苦了，剩下的明天再说~",
  "进度条卡住的时候，喝口水再回来。",
  "把喜欢的东西攒起来，日子就有了形状。",
  "不用每件事都做到最好，做完就很棒了。",
];
