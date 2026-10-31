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
  { title: "ギターと孤独と蒼い惑星", artist: "結束バンド",    url: "/music/ギターと孤独と蒼い惑星-結束バンド.mp3",            cover: "/music/ギターと孤独と蒼い惑星-結束バンド.webp" },
  { title: "忘れてやらない",      artist: "結束バンド",      url: "/music/忘れてやらない-結束バンド.mp3",                cover: "/music/忘れてやらない-結束バンド.jpg" },
];

// ---------- 💬 今日一言 (Daily Quote / 侧栏小卡) ----------
// 每次打开随机展示一条。
export const quotes: string[] = [
  "今天也要元气满满哦~♡",
  "代码写累了就看看可爱的壁纸吧~",
  "二次元的快乐，是三分钟就能续上的~♡",
  "慢慢来，比较快。",
  "今天的主人也要好好宠我一天哦~嘻嘻~♡",
  "把生活过成喜欢的颜色~",
];
