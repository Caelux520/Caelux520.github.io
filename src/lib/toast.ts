// ============================================================
//  🔔 全局提示窗 (Toast) —— 逻辑层
// ------------------------------------------------------------
//  为什么单独放一个文件？
//  · 外观在 src/components/Toast.astro（自带 <style is:global>）
//  · 逻辑在这里，别的脚本可以直接 import 用，不用各自写一遍 DOM~♡
//
//  【用法一】脚本里主动弹（想在某个时机提示时用）
//      import { toast } from "../lib/toast";
//      toast("保存成功啦~♡", { type: "success" });
//      toast("这条不自动消失", { duration: 0 });   // duration: 0 = 只能点掉
//
//  【用法二】给元素加个属性，点一下自动弹（零 JS，最省事）
//      <button data-toast="还没弄好哦~♡">点我</button>
//      <a data-toast="敬请期待~" data-toast-type="warn" data-toast-duration="4000">…</a>
//      ↑ 事件委托绑在 document 上，ClientRouter 切页 / 动态插入的元素都能用，
//        不需要在 astro:page-load 里重新绑定~♡
//
//  【老式 is:inline 脚本里想用】
//      window.toast("…")     // 和 import 进来的完全同一个函数~♡
//
//  【想扩展】
//   · 新配色 → Toast.astro 的 CSS 里补 .toast--error 之类，
//             然后 toast("…", { type: "error" }) 即可，这边不用改~♡
//   · 新参数 → 在 ToastOptions 里加字段，再在 onTriggerClick 里读 data-toast-xxx
// ============================================================

export type ToastType = "info" | "success" | "warn";

export interface ToastOptions {
  /** 配色 + 左侧小图标，默认 "info"~♡ */
  type?: ToastType | string;
  /** 多久后自动消失（毫秒），默认 2600；传 0 = 不自动消失~♡ */
  duration?: number;
  /** 自定义前缀图标（emoji 或任意字符），优先级高于 type~♡ */
  icon?: string;
}

const DEFAULT_DURATION = 2600;
const MAX_VISIBLE = 3;     // 同时最多显示几个，超了就把最老的挤掉~♡
const EXIT_MS = 260;       // 退场动画时长，要和 Toast.astro 里的 transition 对上~♡

const TYPE_ICONS: Record<string, string> = {
  info: "🌸",
  success: "✅",
  warn: "📢",
};

let stackEl: HTMLElement | null = null;

/** 拿到（或创建）承载提示的容器；切页后 DOM 被换掉时会自动重建~♡ */
function getStack(): HTMLElement {
  if (stackEl && stackEl.isConnected) return stackEl;
  stackEl = document.createElement("div");
  stackEl.className = "toast-stack";
  // 读屏友好：内容出来时礼貌地播报，不打断用户当前操作~♡
  stackEl.setAttribute("role", "status");
  stackEl.setAttribute("aria-live", "polite");
  document.body.appendChild(stackEl);
  return stackEl;
}

/**
 * 弹一条提示。
 * @returns 一个「立刻关掉它」的函数（想提前收起时调用）
 */
export function toast(message: string, options: ToastOptions = {}): () => void {
  const text = String(message ?? "").trim();
  const noop = () => {};
  if (!text || typeof document === "undefined") return noop;

  const type = options.type || "info";
  const duration = options.duration == null ? DEFAULT_DURATION : options.duration;

  const stack = getStack();
  // 超出上限：从最早那条开始挤掉，避免一下子糊满屏幕~♡
  while (stack.children.length >= MAX_VISIBLE) {
    stack.firstElementChild?.remove();
  }

  const el = document.createElement("div");
  el.className = "toast toast--" + type;

  const icon = document.createElement("span");
  icon.className = "toast__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = options.icon || TYPE_ICONS[type] || TYPE_ICONS.info;

  const body = document.createElement("span");
  body.className = "toast__msg";
  // 一律用 textContent：外部文案里就算有 < > 也不会被当成 HTML 执行~♡
  body.textContent = text;

  el.append(icon, body);
  stack.appendChild(el);

  // 下一帧再加 is-in，CSS 过渡才会真的跑起来（否则首帧就是终态、看不到动画）~♡
  requestAnimationFrame(() => el.classList.add("is-in"));

  let timer = 0;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    el.classList.remove("is-in");
    el.classList.add("is-out");
    // 动画结束后再删；用定时器兜底（万一动画被系统「减少动效」关掉了）~♡
    window.setTimeout(() => el.remove(), EXIT_MS);
  };

  if (duration > 0) timer = window.setTimeout(close, duration);
  el.addEventListener("click", close);   // 点一下可以提前收掉~♡

  return close;
}

/** 点击带 data-toast 的元素 → 弹提示（用事件委托，全站只绑一次）~♡ */
function onTriggerClick(event: Event) {
  const target = event.target as Element | null;
  const el = target && target.closest ? (target.closest("[data-toast]") as HTMLElement | null) : null;
  if (!el) return;

  const text = el.getAttribute("data-toast") || "";
  if (!text.trim()) return;

  // 它只是个「假入口」：别让 <a href="#"> 之类把页面跳走~♡
  if (el.tagName === "A" || el.tagName === "BUTTON") event.preventDefault();

  const durationAttr = el.getAttribute("data-toast-duration");
  toast(text, {
    type: el.getAttribute("data-toast-type") || undefined,
    icon: el.getAttribute("data-toast-icon") || undefined,
    duration: durationAttr == null ? undefined : Number(durationAttr),
  });
}

// 只在浏览器里装配（万一被 frontmatter import 进构建期，也不会因为没 window 而炸）~♡
if (typeof document !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  if (!w.__toastBound) {
    w.__toastBound = true;
    document.addEventListener("click", onTriggerClick);
    w.toast = toast;
    w.showToast = toast;   // 别名，给老式 is:inline 脚本用~♡
  }
}
