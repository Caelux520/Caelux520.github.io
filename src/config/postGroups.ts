// ============================================================
//  📚 文章分区 (Post Groups) — 日常 / 技术
// ------------------------------------------------------------
//  文章 frontmatter 里的 category 是「细分类」，
//  这里再把它归到两个大分区里：日常 / 技术。
//  /moments/（日常瞬间）和 /archive/（文章档案）两个版块就按它来分~♡
//
//  【扩展点】以后加新分类（比如「生活」「折腾」）：
//    把名字填进对应分区的 categories 数组即可，
//    那个分类的文章会自动归到该分区，页面代码一行都不用动~♡
//  没匹配上的分类默认算「日常」，不会凭空消失。
// ============================================================

export type PostGroupKey = "daily" | "tech";

export type PostGroup = {
  /** 分区标识，同时是路由片段：/posts/<key>/ */
  key: PostGroupKey;
  /** 中文名（界面上显示这个） */
  name: string;
  /** 英文小字（分区标题上的装饰） */
  en: string;
  /** 一句话介绍 */
  desc: string;
  /** Icon 组件里的图标名 */
  icon: string;
  /** 归入本分区的 category 值 */
  categories: string[];
};

export const postGroups: PostGroup[] = [
  {
    key: "daily",
    name: "日常",
    en: "DAILY",
    desc: "生活、追番、随手记下的碎碎念。",
    icon: "sakura",
    categories: ["日常", "随笔", "生活", "记录", "碎碎念", "心情", "日记"],
  },
  {
    key: "tech",
    name: "技术",
    en: "TECH",
    desc: "折腾代码与站点，被 bug 追着跑的那些夜晚。",
    icon: "edit",
    categories: ["技术", "Tech", "教程", "代码", "前端", "笔记", "折腾"],
  },
];

/** 把一个 category 归到大分区；没匹配上的一律算「日常」~♡ */
export function groupOfCategory(category: string): PostGroupKey {
  const hit = postGroups.find((g) => g.categories.includes(category));
  return hit ? hit.key : "daily";
}

/** 按 key 取分区信息（key 写错时兜底第一个，避免页面炸掉~♡） */
export function groupMeta(key: PostGroupKey): PostGroup {
  return postGroups.find((g) => g.key === key) ?? postGroups[0];
}
