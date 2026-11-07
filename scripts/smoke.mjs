#!/usr/bin/env node
// ============================================================
//  🧪 冒烟测试：真的去「点」链接，验证客户端路由没坏
// ------------------------------------------------------------
//  为什么需要它：
//    静态站 build 永远是绿的。但如果 ClientRouter 切页时 DOM 交换抛错
//    （比如嵌套 transition:persist），表现是「点了没反应 / 卡在加载层」，
//    build、tsc、逐个打开 URL 全都发现不了。
//  本脚本用无头浏览器模拟真实点击，断言「URL 变了 + 内容也变了」。
//
//  用法：
//    npm run build && npm run smoke        # 测生产产物（推荐）
//    npm run dev 开着时直接 npm run smoke   # 会自动复用 4321
//    node scripts/smoke.mjs --url http://localhost:4322 --browser "C:\\...\\msedge.exe"
//
//  退出码：0 = 全过，1 = 有失败
// ============================================================
import { spawn } from "node:child_process";
import { existsSync, statSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { rm } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = argOf("url", process.env.SMOKE_URL || "http://localhost:4321").replace(/\/$/, "");
const PORT = Number(new URL(BASE).port || 4321);
const HEADFUL = args.includes("--headed");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 找浏览器 ----------
function findBrowser() {
  const explicit = argOf("browser", process.env.SMOKE_BROWSER);
  if (explicit) return explicit;
  const win = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  const mac = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  const linux = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"];
  const list = process.platform === "win32" ? win : process.platform === "darwin" ? mac : linux;
  return list.find((p) => existsSync(p)) || null;
}

async function reachable(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2500), redirect: "manual" });
    return r.status < 500;
  } catch {
    return false;
  }
}

// ---------- 没有服务器就自己起一个 ----------
async function ensureServer() {
  if (await reachable(BASE)) {
    console.log("· 复用已在运行的服务：" + BASE);
    return { kill: async () => {} };
  }
  if (!existsSync("dist")) {
    console.error("✗ 没有 dist/：先跑 npm run build，或先 npm run dev 再测。");
    process.exit(1);
  }
  console.log("· 启动 astro preview：" + BASE);
  const cli = "node_modules/astro/bin/astro.mjs";
  const child = spawn(process.execPath, [cli, "preview", "--port", String(PORT)], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    if (await reachable(BASE)) return { kill: async () => child.kill() };
    await sleep(300);
  }
  child.kill();
  console.error("✗ preview 起不来（端口被占？用 --url 换个端口）");
  process.exit(1);
}

// ---------- 极简 CDP 客户端（不依赖任何 npm 包） ----------
async function launchBrowser(bin) {
  const profile = path.join(tmpdir(), "smoke-profile-" + Date.now());
  const port = 9400 + Math.floor(Math.random() * 300);
  const child = spawn(bin, [
    HEADFUL ? "--headless=false" : "--headless=new",
    "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
    "about:blank",
  ], { stdio: "ignore" });

  let wsUrl = null;
  for (let i = 0; i < 100 && !wsUrl; i++) {
    try {
      const r = await fetch("http://127.0.0.1:" + port + "/json/version", { signal: AbortSignal.timeout(1000) });
      const j = await r.json();
      wsUrl = j.webSocketDebuggerUrl;
    } catch {}
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) { child.kill(); throw new Error("连不上浏览器 DevTools"); }

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    } else if (msg.method) {
      events.forEach((fn) => fn(msg));
    }
  });
  const send = (method, params, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params: params || {}, sessionId }));
    });

  const target = await send("Target.createTarget", { url: "about:blank" });
  const attached = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  const S = (m, p) => send(m, p, sessionId);

  await S("Page.enable");
  await S("Runtime.enable");

  const errors = [];
  events.push((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails || {};
      const msg = (d.exception && d.exception.description) || d.text || "unknown";
      // ⚠️ 浏览器 View Transitions 的中断信号，不是站点代码的错：
      //    ① 切页动画没播完就跳下一页 → ClientRouter 主动 skipTransition() → AbortError
      //    ② 测试中途改视口尺寸（桌面→手机）→ InvalidStateError: Viewport size changed
      //    这两种都会让冒烟测试偶发红，且只在「测」的时候出现，这里单独放过~♡
      if (/Transition was (skipped|aborted)/i.test(msg) || /skipTransition/i.test(msg)) return;
      errors.push("异常：" + msg);
    } else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      errors.push("console.error：" + (m.params.args || []).map((a) => a.value || a.description || "").join(" "));
    }
  });

  const page = {
    errors,
    async nav(url) {
      const loaded = new Promise((res) => {
        const fn = (m) => {
          if (m.method === "Page.loadEventFired" && m.sessionId === sessionId) res();
        };
        events.push(fn);
        setTimeout(res, 15000);
      });
      await S("Page.navigate", { url });
      await loaded;
      await sleep(400);
    },
    async viewport(width, height, mobile) {
      await S("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: mobile !== false });
    },
    async evaluate(expression) {
      const r = await S("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
      return r.result.value;
    },
    async waitFor(expression, timeout) {
      const t0 = Date.now();
      while (Date.now() - t0 < (timeout || 5000)) {
        try { if (await page.evaluate(expression)) return true; } catch {}
        await sleep(100);
      }
      return false;
    },
    async click(selector) {
      const expr = "(() => { var el = document.querySelector(" + JSON.stringify(selector) + ");" +
        " if (!el) return false; el.click(); return true; })()";
      const ok = await page.evaluate(expr);
      if (!ok) throw new Error("找不到可点击元素：" + selector);
    },
    async close() {
      try { await send("Browser.close"); } catch {}
      child.kill();
      await sleep(300);
      try { await rm(profile, { recursive: true, force: true }); } catch {}
    },
  };

  return page;
}

// ---------- 断言 ----------
const failures = [];
let passed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log("  ✓ " + name + (detail ? "  " + detail : "")); }
  else { failures.push(name + (detail ? " — " + detail : "")); console.log("  ✗ " + name + (detail ? "  " + detail : "")); }
}

const H1 = "(() => { var el = document.querySelector('.main h1'); return el ? el.textContent.trim() : ''; })()";
const h1Equals = (v) => "(() => { var el = document.querySelector('.main h1'); return !!el && el.textContent.trim() === " + JSON.stringify(v) + "; })()";

async function main() {
  const bin = findBrowser();
  if (!bin) { console.error("✗ 找不到 Chrome/Edge，可用 --browser 或 SMOKE_BROWSER 指定路径"); process.exit(1); }

  // dist 过期提醒（只提醒，不阻断）
  if (existsSync("dist/index.html") && existsSync("src")) {
    const distTime = statSync("dist/index.html").mtimeMs;
    let newest = 0;
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else newest = Math.max(newest, statSync(p).mtimeMs);
      }
    };
    walk("src");
    if (newest > distTime + 1000) console.log("⚠ dist 比源码旧，测到的是旧产物；建议先 npm run build\n");
  }

  const server = await ensureServer();
  const page = await launchBrowser(bin);
  try {
    // ===== 桌面：点链接 =====
    console.log("\n▸ 桌面（1280×900）");
    await page.viewport(1280, 900, false);
    await page.nav(BASE + "/");
    // 首页的 h1 是打字机脚本填的，刚加载时可能是空的，这里等它出现
    const homeReady = await page.waitFor("(() => { var el = document.querySelector('.main h1'); return !!el && el.textContent.trim().length > 0; })()", 6000);
    const homeH1 = await page.evaluate(H1);
    check("首页打开", homeReady && !!homeH1, homeH1);

    // 顶栏下拉：按钮要「点得到」（没被遮罩/特效层盖住），展开后的菜单项也要能命中
    const hit = await page.evaluate(
      "(() => {" +
      " var b = document.querySelector('.nav .drop-btn');" +
      " if (!b) return 'no-btn';" +
      " var r = b.getBoundingClientRect();" +
      " var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);" +
      " return top === b || b.contains(top) ? 'ok' : (top ? top.tagName : 'none');" +
      "})()"
    );
    check("顶栏下拉按钮可命中（没被遮住）", hit === "ok", String(hit));

    // 桌面端顶栏没有直接指向 /archive/ 的可见链接（归档在「我的▾」里），
    // 所以这里走真实路径：点开下拉 → 点菜单项
    await page.evaluate("document.querySelectorAll('.nav .drop-btn')[1].click()");
    check("顶栏下拉能展开", await page.waitFor("!!document.querySelector('.nav-drop.open')"));
    const menuHitExpr = (
      "(() => {" +
      " var a = document.querySelector('.nav-drop.open .drop-menu a[href=\"/archive/\"]');" +
      " if (!a) return 'no-item';" +
      " var r = a.getBoundingClientRect();" +
      " var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);" +
      " return top === a || a.contains(top) ? 'ok' : (top ? top.tagName : 'none');" +
      "})()"
    );
    // 用轮询：下拉是 opacity/visibility 过渡出来的，刚点开的那几十毫秒还命中不到
    check("下拉里的「归档」可见可点", await page.waitFor(menuHitExpr));

    await page.click('.nav-drop.open .drop-menu a[href="/archive/"]');
    check("点击菜单项 → 地址跳到 /archive/", await page.waitFor("location.pathname === '/archive/'"));
    check("内容真的换了（不只是地址变）", await page.waitFor("(() => { var el = document.querySelector('.main h1'); return !!el && el.textContent.trim() !== " + JSON.stringify(homeH1) + "; })()"));
    const archiveH1 = await page.evaluate(H1);

    // 归档页现在是「档案条目」(.arc-row)，不再是文章卡~♡
    await page.click(".arc-row .arc-title");
    check("点击档案条目 → 进入 /posts/xxx/", await page.waitFor("location.pathname.startsWith('/posts/')"));
    check("文章正文已渲染", await page.waitFor("!!document.querySelector('.md-content, .post-page-body')"));

    await page.evaluate("history.back()");
    check("返回 → /archive/", await page.waitFor("location.pathname === '/archive/'"));
    check("返回后内容恢复", await page.waitFor(h1Equals(archiveH1)));

    await page.evaluate("history.forward()");
    check("前进 → 回到文章页", await page.waitFor("location.pathname.startsWith('/posts/')"));

    // ===== 手机：抽屉 =====
    console.log("\n▸ 手机（390×844）");
    await page.viewport(390, 844, true);
    await page.nav(BASE + "/");
    await page.click("#btn-menu");
    check("汉堡键能打开抽屉", await page.waitFor("document.getElementById('m-drawer').classList.contains('open')"));
    check("抽屉打开时锁定页面滚动", await page.evaluate("document.body.classList.contains('menu-open')"));
    check("背后内容被 inert（Tab 不会跑到看不见的地方）", await page.evaluate("document.querySelector('.layout').hasAttribute('inert')"));
    // 焦点是在 setMenu 里延迟 60ms 调的，这里要轮询等一下
    check("焦点已移入抽屉", await page.waitFor("document.getElementById('m-drawer').contains(document.activeElement)"));

    await page.click('#m-drawer a[href="/moments/"]');
    check("抽屉里的链接能跳转", await page.waitFor("location.pathname === '/moments/'"));
    check("跳转后抽屉自动收起", await page.waitFor("!document.getElementById('m-drawer').classList.contains('open')"));
    check("跳转后解除滚动锁 + 移除 inert", await page.waitFor("!document.body.classList.contains('menu-open') && !document.querySelector('.layout').hasAttribute('inert')"));

    // ===== 通用体检 =====
    console.log("\n▸ 体检");
    const overflow = await page.evaluate(
      "(() => { var bad = [];" +
      " document.querySelectorAll('.layout, .main, .side, .post-card').forEach(function (el) {" +
      "   var r = el.getBoundingClientRect();" +
      "   if (r.right > innerWidth + 1) bad.push(el.className || el.tagName); });" +
      " return bad.slice(0, 3); })()"
    );
    check("手机端没有横向溢出", !overflow || overflow.length === 0, (overflow || []).join(", "));

    // 加载层是切页后延迟收起的，这里给 3 秒缓冲轮询（卡住才是 bug）
    check("加载层已收起（没卡在加载画面）", await page.waitFor("document.getElementById('loader').classList.contains('done')", 3000));

    check("全程没有 JS 报错", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
  } finally {
    await page.close();
    await server.kill();
  }

  console.log("");
  if (failures.length) {
    console.log("✗ 失败 " + failures.length + " 项 / 通过 " + passed + " 项");
    failures.forEach((f) => console.log("   - " + f));
    process.exitCode = 1;
  } else {
    console.log("✓ 全部通过（" + passed + " 项）");
  }
}

main().catch((e) => { console.error("✗ 冒烟测试自身出错：", e); process.exitCode = 1; });
