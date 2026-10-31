// ============================================================
//  🎀 Live2D 看板娘配置 (Mizuki 同款方案)
// ------------------------------------------------------------
//  架构（跟 Mizuki 一样）：
//    主页面 <iframe src="/live2d/host.html">
//      → host.html 里加载 live2d-widget.min.js，调 L2D_WIDGET.createWidget()
//      → 主页面 postMessage 传配置、收事件，所以 widget 的样式/脚本完全隔离
//
//  ⚠️ 你平时只需要改这个文件~♡
//    · 换模型   → 改 models（加一条就行），path 填 model3.json / model.json
//    · 调大小   → size（正方形边长，widget 自己按比例缩放模型）
//    · 调位置   → position / offsetX / offsetY
//    · 改菜单   → menus.items（icon 是 iconify 名字，例如 mdi:bed）
//    · 关掉     → enabled: false
//
//  📁 自己的模型放哪？
//     丢进 public/live2d/models/<名字>/，path 写 "/live2d/models/<名字>/xxx.model3.json"
//     （默认示例是外链，换成自己的时候记得删掉）
//
//  🧩 支持两种格式：
//     · Cubism 4 → xxx.model3.json（主流 .moc3）
//     · Cubism 2 → xxx.model.json（老 .moc，widget 里也带了运行时）
//
//  🔌 主页面可用的接口（window.Live2D）：
//     Live2D.say("晚上好呀~")     弹气泡
//     Live2D.sleep() / .wake()    睡一会 / 叫醒
//     Live2D.toggle()             切换
//     Live2D.switchModel(0)       换第几个模型
//     Live2D.models()             模型列表
//     Live2D.on("tap", fn)        点模型（接音效、接 AI 都从这里进）
//     Live2D.frame                iframe 本体，想怎么折腾都行
// ============================================================

/** widget 内置的 tips：欢迎语 + 自言自语（跟 Mizuki 的字段名一致） */
export interface Live2DTips {
  /** 第一次加载时说的话 */
  welcomeMessage: string[];
  /** 隔一会儿轮播的话 */
  messages: string[];
  /** 每条显示多久（ms） */
  duration: number;
  /** 两条之间隔多久（ms） */
  interval: number;
}

export interface Live2DModelEntry {
  /** 唯一 id，Live2D.switchModel 按顺序切 */
  id: string;
  /** 菜单/调试里用的名字 */
  name: string;
  /** model3.json（Cubism 4）或 model.json（Cubism 2）的地址 */
  path: string;
  /** 这个模型专属的 tips，不填就用下面的全局 tips */
  tips?: Partial<Live2DTips>;
}

/** 菜单动作：
 *  chat  陪我聊一句（主页面弹气泡）
 *  top   回到顶部
 *  home  回首页
 *  sleep 睡一会（widget 自带「正在休息」按钮，点它醒）
 *  switch 换下一个模型（只有一个模型时自动隐藏）
 */
export type Live2DMenuAction = "chat" | "top" | "home" | "sleep" | "switch";

export interface Live2DMenuItem {
  /** iconify 图标名，例如 "mdi:bed"（离线时会退化成文字） */
  icon: string;
  /** 悬停提示 / 无图标时的文字，建议 2~4 个字 */
  label: string;
  action: Live2DMenuAction;
}

export interface Live2DConfig {
  /** 总开关 */
  enabled: boolean;
  /** 贴哪一边 */
  position: "bottom-left" | "bottom-right";
  /** 模型区域边长（px），widget 会把模型等比缩进这个正方形 */
  size: number;
  /** iframe 额外留的高度：上面的气泡（tip）要用，太小会被裁掉 */
  extraHeight: number;
  /** 离屏幕边的距离 */
  offsetX: number;
  offsetY: number;
  zIndex: number;
  /** 出场动画 */
  transitionDuration: number;
  transitionType: "slide" | "fade";
  /** 菜单按钮 / 休息条的主色（建议跟站点 accent 一致） */
  primaryColor: string;

  /** 模型列表 */
  models: Live2DModelEntry[];
  /** 默认第几个（索引） */
  defaultModel: number;

  /** 全局台词 */
  tips: Live2DTips;

  /** 右键/悬停菜单 */
  menus: {
    align: "left" | "right";
    items: Live2DMenuItem[];
  };

  /** 手机端 */
  hiddenOnMobile: boolean;
  breakpoint: number;

  /** 主页面气泡（Live2D.say / 点模型说话用的） */
  bubble: { enabled: boolean; duration: number };
  /** 点模型时随机说的话 */
  touchLines: string[];

  /** 快捷键：L 睡下 / 叫醒，null 关掉 */
  shortcut: string | null;
}

export const live2dConfig: Live2DConfig = {
  // ⏸️ 等模型：现在是关掉的（页面上不会出现任何东西，不会留个「正在加载」的框）
  // 找到模型后按三步走：
  //   1. 模型文件夹丢进 public/live2d/models/<名字>/
  //   2. 下面 models[0].path 改成 "/live2d/models/<名字>/xxx.model3.json"
  //   3. 把这一行改成 true
  enabled: false,
  position: "bottom-right",
  size: 280,
  extraHeight: 84,
  offsetX: 8,
  offsetY: 76,
  zIndex: 900,
  transitionDuration: 1200,
  transitionType: "slide",
  primaryColor: "rgba(124, 92, 255, 0.9)",

  models: [
    {
      id: "haru",
      name: "Haru（示例模型）",
      // ⚠️ 示例模型是外链，换成自己的记得改这里
      path: "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display@master/test/assets/haru/haru_greeter_t03.model3.json",
    },
  ],
  defaultModel: 0,

  tips: {
    welcomeMessage: [
      "欢迎回来~ 我是这里的看板娘♡",
      "今天也来看我了呀。",
    ],
    messages: [
      "记得多喝水呀。",
      "坐久了记得站起来动一动~",
      "今天也要好好休息哦。",
      "要不要去翻翻旧文章？",
    ],
    duration: 4200,
    interval: 45000,
  },

  menus: {
    align: "right",
    items: [
      { icon: "mdi:chat-outline", label: "聊天", action: "chat" },
      { icon: "mdi:arrow-up", label: "回顶", action: "top" },
      { icon: "mdi:shuffle-variant", label: "换人", action: "switch" },
      { icon: "mdi:bed", label: "睡觉", action: "sleep" },
    ],
  },

  hiddenOnMobile: true,
  breakpoint: 767,

  bubble: { enabled: true, duration: 4200 },
  touchLines: [
    "诶嘿~",
    "痒痒的啦！",
    "再戳我就要生气了哦。",
    "在的在的，我在听~",
  ],

  shortcut: "l",
};
