// ============================================================
//  🧩 Live2D 主页面控制器 (Frame Driver)
// ------------------------------------------------------------
//  参考 Mizuki 的做法：
//    · 真正的 Live2D 跑在同源 iframe 里（/live2d/host.html）
//    · 这里只负责「传配置 + 收事件 + 提供 window.Live2D 接口」
//  好处：widget 的样式/脚本跟站点完全隔离，切页也不会互相影响~♡
// ============================================================
import { live2dConfig, type Live2DConfig } from "../../config/live2d";

export type Live2DFrameEvent =
  | "loaded"   // 模型加载完
  | "tap"      // 点了模型（detail: { x, y }）
  | "model"    // 换了模型（detail: { index }）
  | "sleep"    // 睡下了
  | "wake"     // 醒了
  | "action"   // 菜单里没被内建处理的动作
  | "error";

export interface Live2DFrameApi {
  /** 第一次加载完成 */
  readonly ready: Promise<void>;
  readonly root: HTMLElement | null;
  readonly frame: HTMLIFrameElement | null;

  isLoaded(): boolean;
  /** 弹气泡（不传文本就随机说一句 touchLines） */
  say(text?: string, duration?: number): void;
  sleep(): void;
  wake(): void;
  toggle(): void;
  switchModel(index: number): void;
  currentModel(): number;
  models(): { id: string; name: string }[];
  on(event: Live2DFrameEvent, fn: (detail?: unknown) => void): () => void;
  /** 重新检查 DOM（切页后调用） */
  refresh(): void;
}

declare global {
  interface Window {
    Live2D?: Live2DFrameApi;
    __live2dFrame?: Live2DFrameApi;
  }
}

function pick<T>(list: T[]): T | undefined {
  return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function createLive2D(cfg: Live2DConfig): Live2DFrameApi {
  let root: HTMLElement | null = null;
  let frame: HTMLIFrameElement | null = null;
  let bubble: HTMLElement | null = null;
  let sentKey = "";
  let loaded = false;
  let asleep = false;
  let currentIndex = cfg.defaultModel ?? 0;
  let bubbleTimer = 0;

  const listeners = new Map<Live2DFrameEvent, Set<(detail?: unknown) => void>>();
  let resolveReady: () => void = () => { /* noop */ };
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  function emit(event: Live2DFrameEvent, detail?: unknown) {
    listeners.get(event)?.forEach((fn) => {
      try { fn(detail); } catch (err) { console.warn("[live2d] 回调出错：", err); }
    });
    try {
      window.dispatchEvent(new CustomEvent("live2d:" + event, { detail }));
    } catch { /* ignore */ }
  }

  function on(event: Live2DFrameEvent, fn: (detail?: unknown) => void) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
    return () => { listeners.get(event)?.delete(fn); };
  }

  // ---------- 传给 widget 的配置 ----------
  function payload() {
    return {
      model: cfg.models.map((m) => ({
        path: m.path,
        tips: m.tips ? { ...cfg.tips, ...m.tips } : cfg.tips,
      })),
      position: cfg.position,
      size: cfg.size,
      transitionDuration: cfg.transitionDuration,
      transitionType: cfg.transitionType,
      primaryColor: cfg.primaryColor,
      menus: {
        align: cfg.menus.align,
        items: cfg.menus.items,
      },
    };
  }

  function isNarrow() {
    if (!cfg.hiddenOnMobile) return false;
    try { return window.matchMedia("(max-width: " + cfg.breakpoint + "px)").matches; } catch { return false; }
  }

  // ---------- 与 iframe 通信 ----------
  function sendInit(force: boolean) {
    if (!frame || !frame.contentWindow) return;
    const next = payload();
    const key = JSON.stringify(next);
    if (!force && key === sentKey) return;
    sentKey = key;
    frame.contentWindow.postMessage({ type: "l2d-init", config: next }, "*");
  }

  function send(cmd: string, extra?: Record<string, unknown>) {
    frame?.contentWindow?.postMessage({ type: "l2d-cmd", cmd, ...(extra || {}) }, "*");
  }

  function onFrameLoad() {
    sentKey = "";
    sendInit(true);
  }

  function ensure() {
    const nextRoot = document.getElementById("l2d-root");
    const nextFrame = document.getElementById("l2d-frame") as HTMLIFrameElement | null;
    if (!nextRoot || !nextFrame) return false;

    root = nextRoot;
    bubble = document.getElementById("l2d-bubble");

    if (nextFrame !== frame) {
      frame = nextFrame;
      sentKey = "";
      loaded = false;
      frame.addEventListener("load", onFrameLoad);
    }
    return true;
  }

  function boot() {
    if (!cfg.enabled) return;
    if (!ensure()) return;

    if (isNarrow()) {
      root!.dataset.off = "1";
      return;
    }
    root!.dataset.off = "0";

    const src = frame!.dataset.src || "";
    if (src && !frame!.getAttribute("src")) {
      frame!.setAttribute("src", src); // 触发 load → onFrameLoad
      return;
    }
    if (frame!.contentDocument && frame!.contentDocument.readyState === "complete") {
      sendInit(false);
    }
  }

  // ---------- 气泡 ----------
  function hideBubble() {
    window.clearTimeout(bubbleTimer);
    bubble?.classList.remove("is-on");
  }

  function say(text?: string, duration?: number) {
    if (!cfg.bubble.enabled) return;
    if (!bubble) bubble = document.getElementById("l2d-bubble");
    if (!bubble) return;
    const msg = String(text ?? pick(cfg.touchLines) ?? "").trim();
    if (!msg) return;
    bubble.textContent = msg;
    bubble.classList.add("is-on");
    window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(hideBubble, Math.max(900, duration ?? cfg.bubble.duration));
    emit("action", { action: "say", text: msg });
  }

  // ---------- 菜单动作 ----------
  function handleAction(action: string) {
    if (action === "chat") { say(); return; }
    if (action === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (action === "home") { window.location.href = new URL("/", window.location.origin).href; return; }
    emit("action", { action });
  }

  // ---------- 消息 ----------
  function onMessage(ev: MessageEvent) {
    if (!frame || ev.source !== frame.contentWindow) return;
    const data = (ev.data || {}) as { type?: string; [key: string]: unknown };
    switch (data.type) {
      case "l2d-loaded":
        loaded = true;
        frame.classList.add("is-ready");
        resolveReady();
        emit("loaded", data);
        break;
      case "l2d-action":
        handleAction(String(data.action || ""));
        break;
      case "l2d-tap":
        emit("tap", data);
        if (cfg.bubble.enabled) say();
        break;
      case "l2d-model":
        currentIndex = Number(data.index) || 0;
        emit("model", data);
        break;
      case "l2d-sleep":
        asleep = true;
        hideBubble();
        emit("sleep");
        break;
      case "l2d-wake":
        asleep = false;
        emit("wake");
        break;
      case "l2d-error":
        console.warn("[live2d] " + String(data.message || "未知错误"));
        emit("error", data);
        break;
      default:
        break;
    }
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (!cfg.shortcut || isTyping()) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key.toLowerCase() !== cfg.shortcut.toLowerCase()) return;
    ev.preventDefault();
    api.toggle();
  }

  const api: Live2DFrameApi = {
    ready,
    get root() { return root; },
    get frame() { return frame; },
    isLoaded: () => loaded,
    say,
    sleep() { asleep = true; send("sleep"); },
    wake() { asleep = false; send("wake"); },
    toggle() { asleep ? api.wake() : api.sleep(); },
    switchModel(index: number) {
      currentIndex = index;
      send("switch", { index });
    },
    currentModel: () => currentIndex,
    models: () => cfg.models.map((m) => ({ id: m.id, name: m.name })),
    on,
    refresh: boot,
  };

  window.addEventListener("message", onMessage);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", boot);
  document.addEventListener("astro:page-load", boot);

  // 首屏先别抢带宽：空闲了再去拉 iframe 里的 widget~♡
  const kick = () => boot();
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === "function") ric(kick, { timeout: 2500 });
  else window.setTimeout(kick, 600);

  return api;
}

export function mountLive2D(cfg: Live2DConfig = live2dConfig): Live2DFrameApi | null {
  if (!cfg.enabled || typeof window === "undefined") return null;

  const existing = window.__live2dFrame;
  if (existing) {
    existing.refresh();
    return existing;
  }

  const api = createLive2D(cfg);
  window.__live2dFrame = api;
  window.Live2D = api;
  return api;
}
