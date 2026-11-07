/* ============================================================
   🌊 实时水波滤镜（WebGL 计算 · 仅桌面端）
   ------------------------------------------------------------
   在原来樱花那一层放一块透明 canvas，用 fragment shader 每帧算：
     · 域扭曲 fBm 噪声 → 水面高度
     · 屏幕空间导数 → 法线 → 定向光的高光 / 焦散
   所以水纹是「算出来的」，不是一张图在平移~♡
   移动端 / 触屏 / prefers-reduced-motion：不初始化，自动保留
   global.css 里那张静态水纹，手机不会多付一点 GPU~♡
   ============================================================ */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
#extension GL_OES_standard_derivatives : enable
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  u_res;
uniform float u_time;
uniform float u_strength;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 3.4;
  float t = u_time;

  // 很慢的整体漂移 + 两层域扭曲：水面是「流」的，不是「闪」的
  vec2 drift = vec2(0.012, 0.007) * t;
  vec2 q = vec2(
    fbm(p + drift + vec2(0.035, 0.021) * t),
    fbm(p + drift + vec2(5.2, 1.3) - vec2(0.028, 0.030) * t)
  );
  vec2 r = vec2(
    fbm(p + drift + 2.0 * q + vec2(1.7, 9.2) + vec2(0.020, -0.016) * t),
    fbm(p + drift + 2.0 * q + vec2(8.3, 2.8) - vec2(0.018, 0.024) * t)
  );
  float h = fbm(p + drift + 1.8 * r);
  // 再叠一层高频细节：大起伏是「水」，小褶皱才是高光~♡
  h += 0.040 * noise(p * 5.5 + vec2(0.040, -0.030) * t + r * 1.4);

  // 屏幕空间导数当法线：按 620px 的参考高度定标，换分辨率时观感不变~♡
  vec2 grad = vec2(dFdx(h), dFdy(h)) * (170.0 * u_res.y / 620.0);
  vec3 n = normalize(vec3(-grad, 1.0));
  vec3 L = normalize(vec3(-0.55, -0.58, 0.60));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(diff, 48.0);
  float relief = smoothstep(0.32, 1.0, diff);

  float var = 0.90 + 0.18 * sin(uv.x * 9.0 + uv.y * 5.0 + t * 0.12);
  float alpha = (0.12 + 0.25 * relief + 0.45 * spec) * u_strength * var;

  vec3 deep  = vec3(0.34, 0.70, 0.86);
  vec3 light = vec3(0.91, 0.99, 1.00);
  vec3 col = mix(deep, light, clamp(relief * 0.7 + spec, 0.0, 1.0));

  float a = clamp(alpha, 0.0, 0.62);
  // 预乘 alpha 输出：浏览器合成时不会把颜色再乘一次，亮部不会被压暗~♡
  gl_FragColor = vec4(col * a, a);
}
`;

(function () {
  // 同一次会话里脚本万一被加载两次：只保留第一份状态~♡
  if (window.__waterRippleSync) { window.__waterRippleSync(); return; }

  const state = {
    canvas: null, gl: null, program: null, buffer: null,
    uRes: null, uTime: null, uStrength: null,
    raf: 0, running: false, live: false,
    start: 0, last: 0, scale: 0.78,
    frames: 0, sumDt: 0, sample: 30, resizeTimer: 0, disabled: false,
  };

  function skipped() {
    return window.matchMedia('(max-width: 768px)').matches ||
           window.matchMedia('(pointer: coarse)').matches ||
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.__waterRippleDebug) console.warn('[water] shader:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function resize() {
    const c = state.canvas, gl = state.gl;
    if (!c || !gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.max(1, Math.round(c.clientWidth * dpr * state.scale));
    const h = Math.max(1, Math.round(c.clientHeight * dpr * state.scale));
    if (c.width === w && c.height === h) return;
    c.width = w;
    c.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(state.uRes, w, h);
  }

  function frame(now) {
    if (!state.running) return;
    state.raf = requestAnimationFrame(frame);
    if (document.hidden) return;

    const minDt = 1000 / 30; // 水面很慢，30fps 足够；也顺手省掉一半重绘
    if (now - state.last < minDt - 1.5) return;
    const dt = state.last ? now - state.last : minDt;
    state.last = now;

    const gl = state.gl;
    if (!gl) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(state.uTime, (now - state.start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!state.live) {
      state.live = true;
      document.documentElement.classList.add('water-live');
    }

    // 帧率兜底：连续掉帧就降分辨率，还不行就退回静态水纹~♡
    state.frames++;
    state.sumDt += dt;
    if (state.frames >= state.sample) {
      const avg = state.sumDt / state.frames;
      state.frames = 0;
      state.sumDt = 0;
      state.sample = 90; // 首轮 30 帧先快速探底，之后每 90 帧评估一次~♡
      if (avg > 100) {
        // 连 10fps 都不到：别让用户等四轮降档，直接回静态~♡
        state.disabled = true;
        stop();
        return;
      }
      if (avg > 52 && state.scale > 0.44) {
        state.scale = Math.max(0.42, state.scale - 0.12);
        resize();
      } else if (avg > 52) {
        // 已经到最低档还是低于 ~19fps，切静态；不再留 16~19fps 的缝~♡
        state.disabled = true;
        stop();
      }
    }
  }

  function onLost(e) {
    // 旧画布被切走时也会发 contextlost；别让它把新画布的循环一起关掉~♡
    if (e && e.target && state.canvas && e.target !== state.canvas) return;
    if (e && e.preventDefault) e.preventDefault();
    state.running = false;
    state.live = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    document.documentElement.classList.remove('water-live');
    state.canvas = null;
    state.gl = null;
    state.program = null;
    state.buffer = null;
  }

  function start(canvas) {
    const gl = canvas.getContext('webgl', {
      alpha: true, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: true, preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl || gl.isContextLost()) return false;
    if (!gl.getExtension('OES_standard_derivatives')) return false;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (window.__waterRippleDebug) console.warn('[water] link:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return false;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    canvas.addEventListener('webglcontextlost', onLost, false);
    state.canvas = canvas;
    state.gl = gl;
    state.program = prog;
    state.buffer = buf;
    state.uRes = gl.getUniformLocation(prog, 'u_res');
    state.uTime = gl.getUniformLocation(prog, 'u_time');
    state.uStrength = gl.getUniformLocation(prog, 'u_strength');
    gl.uniform1f(state.uStrength, 1.0);

    state.scale = 0.78;
    state.live = false;
    state.last = 0;
    state.frames = 0;
    state.sumDt = 0;
    state.sample = 30;
    resize();
    state.start = performance.now() - 1000 * 8; // 从第 8 秒的形态开始，避免一上来太「平」
    state.running = true;
    state.raf = requestAnimationFrame(frame);
    return true;
  }

  function stop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.live = false;
    document.documentElement.classList.remove('water-live');
    const canvas = state.canvas;
    const gl = state.gl;
    if (canvas) canvas.removeEventListener('webglcontextlost', onLost);
    if (gl) {
      // 先擦成透明，静态水纹才能干净地露出来~♡
      try { gl.clear(gl.COLOR_BUFFER_BIT); gl.flush(); } catch (e) {}
      if (state.program) gl.deleteProgram(state.program);
      if (state.buffer) gl.deleteBuffer(state.buffer);
      // 页面切走后画布会被丢掉，这时主动释放上下文；
      // 同一块画布（横竖屏来回切）则保留，下次还能直接重启~♡
      if (canvas && !canvas.isConnected) {
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    }
    state.canvas = null;
    state.gl = null;
    state.program = null;
    state.buffer = null;
  }

  function sync() {
    const canvas = document.getElementById('water-ripple');
    if (!canvas) { if (state.running) stop(); return; }
    if (state.disabled || skipped()) { if (state.running) stop(); return; }
    if (state.canvas === canvas && state.running) { resize(); return; }
    if (state.running) stop();
    start(canvas);
  }

  window.__waterRippleSync = sync;
  window.__waterRippleStop = stop;

  document.addEventListener('astro:page-load', sync);

  window.addEventListener('resize', function () {
    clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(function () {
      if (state.running) resize(); else sync();
    }, 180);
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { state.last = 0; state.frames = 0; state.sumDt = 0; }
  });

  try {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqSmall = window.matchMedia('(max-width: 768px)');
    const mqTouch = window.matchMedia('(pointer: coarse)');
    if (mqMotion.addEventListener) mqMotion.addEventListener('change', sync);
    if (mqSmall.addEventListener) mqSmall.addEventListener('change', sync);
    if (mqTouch.addEventListener) mqTouch.addEventListener('change', sync);
  } catch (e) { /* 老浏览器忽略~♡ */ }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync);
  else sync();
})();
