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
  /** 睡觉 / 唤醒切换 */
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

// 睡眠状态只记在内存里：站内切页面她保持睡着，但重新进站（刷新/新开标签）一律是醒着的。
// 之前存 localStorage 会变成「一次点了睡觉，以后每次进站都是正在休息」，太劝退，撤掉~♡
const LEGACY_KEYS = ["l2d-asleep", "l2d-hidden"];
function dropLegacyState() {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  } catch { /* 隐私模式无所谓 */ }
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
  let failTimer = 0;

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
        // ⛔ widget 自带的台词气泡整个关掉（tips: false → 不创建气泡 DOM）。
        //    传空数组是不行的：它照样会建一个空框，在头顶留下一个小紫块。
        //    所有台词统一走主页面那个 .l2d-bubble，见 say() / startTips()
        tips: false,
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
      armFailTimer();
      return;
    }
    if (frame!.contentDocument && frame!.contentDocument.readyState === "complete") {
      sendInit(false);
      armFailTimer();
    }
  }

  // 兜底：模型路径写错 / 网络被墙时，widget 不会回传 loaded，
  // 不处理的话 iframe 会永远停在 opacity:0（用户看到的是「什么都没发生」）。
  // ⏱️ 18 秒：给慢网留余量（之前的 15MB 模型 8 秒根本下不完，会误判成失败）~♡
  function armFailTimer() {
    window.clearTimeout(failTimer);
    failTimer = window.setTimeout(() => {
      if (loaded || !root) return;
      root.dataset.off = "1";
      console.warn("[live2d] 模型 18 秒内没有加载完成，已隐藏看板娘；请检查 models 里的 path 或网络。");
    }, 18000);
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

  // 点一下说一句，但 2.5 秒内只认一次
  const TAP_COOLDOWN = 2500;
  let lastTapAt = 0;

  // ---------- 全屏视线跟随 ----------
  // widget 内部按 canvas 矩形算视线（followPointer），鼠标一出那块画布就顶到头了。
  // 这里把「整个视口」当成观察区，反算出 iframe 里该给的 clientX/clientY，
  // 再合成一个 mousemove 丢进去 —— 于是鼠标在页面任何角落，她都会看过去~♡
  let gazeBound = false;
  let gazeQueued = false;
  let gazeX = 0;
  let gazeY = 0;

  function bindGaze() {
    if (gazeBound) return;
    gazeBound = true;
    window.addEventListener(
      "pointermove",
      (ev: PointerEvent) => {
        gazeX = ev.clientX;
        gazeY = ev.clientY;
        if (gazeQueued) return;
        gazeQueued = true;
        requestAnimationFrame(() => {
          gazeQueued = false;
          const doc = frame?.contentDocument;
          const win = frame?.contentWindow as any;
          // 不看 asleep：万一睡眠状态没同步回来，也别让视线跟随永久瘫掉
          if (!doc || !win || !loaded) return;
          const canvas = doc.querySelector("canvas");
          if (!canvas) return;
          const r = canvas.getBoundingClientRect();      // iframe 内坐标
          const fr = frame!.getBoundingClientRect();     // 视口坐标
          const cx = fr.left + r.left + r.width / 2;
          const cy = fr.top + r.top + r.height / 2;
          // 以她的脑袋为圆心，半屏为半径做归一化，超出就夹到 ±1（贴合原来 clamp 的语义）
          const i = Math.max(-1, Math.min(1, (gazeX - cx) / (window.innerWidth * 0.5)));
          const a = Math.max(-1, Math.min(1, -(gazeY - cy) / (window.innerHeight * 0.5)));
          doc.dispatchEvent(
            new win.MouseEvent("mousemove", {
              clientX: r.left + r.width / 2 + i * (r.width / 2),
              clientY: r.top + r.height / 2 - a * (r.height / 2),
              bubbles: true,
            }),
          );
        });
      },
      { passive: true },
    );
  }

  // ---------- 主动说话 ----------
  let tipTimer = 0;
  function startTips() {
    window.clearInterval(tipTimer);
    tipTimer = window.setInterval(() => {
      if (!loaded || asleep || document.visibilityState !== "visible") return;
      const line = pick(cfg.tips.messages);
      if (line) say(line);
    }, Math.max(15000, cfg.tips.interval));
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
        window.clearTimeout(failTimer);
        frame.classList.add("is-ready");
        resolveReady();
        emit("loaded", data);
        // 加载完先说一句欢迎（用的是主页面那个气泡）
        window.setTimeout(() => say(pick(cfg.tips.welcomeMessage), 5600), 420);
        startTips();
        bindGaze();
        // 站内切页面回来 → 保持睡着，别把人吵醒
        if (asleep) send("sleep");
        break;
      case "l2d-action":
        handleAction(String(data.action || ""));
        break;
      case "l2d-tap": {
        emit("tap", data);
        // 🚫 连点冷却：2.5 秒内再点不吭声，免得疯狂戳把气泡刷成跑马灯~♡
        const now = Date.now();
        if (now - lastTapAt < TAP_COOLDOWN) break;
        lastTapAt = now;
        if (cfg.bubble.enabled) say();
        break;
      }
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
        window.clearTimeout(failTimer);
        if (root) root.dataset.off = "1";
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
  // 💾 省流量用户直接不加载：看板娘整套要吃掉几 MB 流量，
  //    开省流/2G 的时候为一个装饰品花掉这么多流量不合适~♡
  const conn = (navigator as any).connection;
  const kick = () => {
    if (conn && (conn.saveData || /^(slow-)?2g$/.test(String(conn.effectiveType || "")))) {
      console.info("[live2d] 检测到省流量模式，跳过看板娘加载。");
      return;
    }
    boot();
  };
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === "function") ric(kick, { timeout: 2500 });
  else window.setTimeout(kick, 600);

  return api;
}

export function mountLive2D(cfg: Live2DConfig = live2dConfig): Live2DFrameApi | null {
  if (!cfg.enabled || typeof window === "undefined") return null;

  dropLegacyState();

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
