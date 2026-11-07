// ============================================================
//  🧮 工具函数（自动计算，别乱删）
//  ------------------------------------------------------------
//  这是从原 config.ts 拆出来的「计算工具模块」。
//  集中数学/统计类 helper，供 posts.ts 计算站点统计用~♡
// ============================================================

// 计算正文中文字数（去空白/标点后的大致字符数）
export function wordCount(content: string): number {
  const clean = (content || "").replace(/\s/g, "").replace(/[，。！？；：、,.!?;:"'（）()【】[\]《》<>「」『』—…·~]/g, "");
  return clean.length;
}
// 计算从开始日期到今天跑了多少天（本地日期）
export function runningDays(start: string): number {
  const startDate = new Date(start).getTime();
  const now = new Date().getTime();
  const days = Math.floor((now - startDate) / 86400000);
  return days >= 0 ? days : 0;
}
