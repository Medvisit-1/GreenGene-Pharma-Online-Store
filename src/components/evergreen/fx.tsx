"use client";

import { useEffect, useRef } from "react";

/**
 * Evergreen Night background: a hairline grid plus a canvas of fireflies.
 * First visit in a session: a seed pulses, the fireflies gather into a sprout,
 * "GreenGene Pharma" appears, then they drift out and keep floating in the
 * background, shying away from the cursor and taking on the current goal colour.
 * Later visits skip straight to the floating fireflies.
 * Also wires scroll reveals (.rv), the hero card parallax and the card glow.
 */
export function EvergreenFx({ rootSelector = ".gx", ambient = true }: { rootSelector?: string; ambient?: boolean } = {}) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    const cv = cvRef.current, bg = bgRef.current, word = wordRef.current, skipBtn = skipRef.current;
    if (!root || !cv || !bg || !word || !skipBtn) return;
    const cx = cv.getContext("2d");
    if (!cx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = !!sessionStorage.getItem("gx-intro");
      sessionStorage.setItem("gx-intro", "1");
    } catch {}
    const playIntro = !seen && !reduce;

    // ---- scroll reveal ----
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    const startReveal = () =>
      root.querySelectorAll<HTMLElement>(".rv:not(.in)").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });

    // ---- card glow follows the pointer ----
    const onCardMove = (e: PointerEvent) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>(".pc");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    };
    root.addEventListener("pointermove", onCardMove);

    // ---- fireflies ----
    const T_FORM = 0.9, T_DISP = 3.8, T_UI = 4.3, T_END = 5.5;
    let W = 0, H = 0, DPR = 1, mx = -999, my = -999, sprite: HTMLCanvasElement | null = null, spriteKey = "";
    type P = { tx: number; ty: number; sx: number; sy: number; cx: number; cy: number; d: number; dur: number; e: number; hx: number; hy: number; size: number; ph: number; ax: number; ay: number; sp: number; amb: boolean; ox: number; oy: number; c: number };
    let parts: P[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

    // The real GreenGene Pharma logo, sampled into points with their brand colour
    // (0 = lime "Pharma"/helix, 1 = teal cross/helix, 2 = lettering, shown light on the dark ground).
    const SW = 400;
    let SH = 196, logoPts: [number, number, number][] = [], lightLogo: HTMLCanvasElement | null = null;
    const BRAND = ["140,198,63", "38,170,170", "236,242,238"];
    function sampleLogo(img: HTMLImageElement) {
      SH = Math.round((SW * img.naturalHeight) / img.naturalWidth);
      const s = document.createElement("canvas"); s.width = SW; s.height = SH;
      const g = s.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0, SW, SH);
      const im = g.getImageData(0, 0, SW, SH), d = im.data;
      const kind = (i: number) => {
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        if (gg - r > 40 && gg - b > 40) return 0;
        if (b > r + 40 && gg > r + 40) return 1;
        return 2;
      };
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 40) continue;
        if (kind(i) === 2) { d[i] = 236; d[i + 1] = 242; d[i + 2] = 238; }
      }
      g.putImageData(im, 0, 0);
      lightLogo = s;
      logoPts = [];
      for (let y = 0; y < SH; y += 2) for (let x = 0; x < SW; x += 2) {
        const i = (y * SW + x) * 4;
        if (d[i + 3] > 140) logoPts.push([x, y, kind(i)]);
      }
    }
    let lx = 0, ly = 0, lw = 0, lh = 0;
    function build(introCount: boolean) {
      DPR = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
      cv!.width = W * DPR; cv!.height = H * DPR; cv!.style.width = W + "px"; cv!.style.height = H + "px";
      const small = W < 700;
      const amb = small ? 70 : 140;
      const src = logoPts.length ? logoPts : Array.from({ length: amb }, () => [rnd(0, SW), rnd(0, SH), 0] as [number, number, number]);
      const pts = [...src].sort(() => Math.random() - 0.5).slice(0, introCount ? (small ? 1100 : 1900) : amb);
      lw = Math.min(W * 0.82, 640); lh = (lw * SH) / SW; lx = W / 2 - lw / 2; ly = H / 2 - lh / 2 - 30;
      const sc = lw / SW, sx = W / 2, sy = ly + lh + 70;
      parts = pts.map((p, i) => {
        const tx = lx + p[0] * sc, ty = ly + p[1] * sc, a = Math.random() * 6.28, r = rnd(40, 170);
        return {
          tx, ty, sx, sy, cx: (sx + tx) / 2 + Math.cos(a) * r, cy: (sy + ty) / 2 + Math.sin(a) * r - 60,
          d: T_FORM + (p[0] / SW) * 0.8 + Math.random() * 0.3, dur: rnd(0.9, 1.3),
          e: Math.random() * 0.35, hx: rnd(0, W), hy: rnd(0, H), size: rnd(1.6, 3.2), ph: rnd(0, 6.28),
          ax: rnd(10, 40), ay: rnd(10, 40), sp: rnd(0.2, 0.7), amb: i < amb, ox: 0, oy: 0, c: p[2],
        };
      });
    }
    const brandSprites = BRAND.map((rgb) => glow(rgb));
    function glow(rgb: string) {
      const c = document.createElement("canvas"); c.width = c.height = 48;
      const g = c.getContext("2d")!, gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
      gr.addColorStop(0, "rgba(255,255,240,1)"); gr.addColorStop(0.22, `rgba(${rgb},.85)`); gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
    }
    function makeSprite(rgb: string) {
      if (rgb === spriteKey) return;
      spriteKey = rgb; sprite = glow(rgb);
    }
    function frame(t: number) {
      makeSprite(getComputedStyle(root!).getPropertyValue("--acc-rgb").trim() || "140,198,63");
      cx!.setTransform(DPR, 0, 0, DPR, 0, 0); cx!.clearRect(0, 0, W, H);
      // glowing light on the dark ground; on the light page, soft coloured dots instead
      const light = ended && document.documentElement.dataset.mode === "light";
      cx!.globalCompositeOperation = light ? "source-over" : "lighter";
      const dim = light ? 0.55 : 1;
      if (t < T_FORM + 0.5 && parts.length) {
        const pulse = 1 + 0.35 * Math.sin(t * 5.2), a = t < T_FORM ? 1 : 1 - (t - T_FORM) / 0.5;
        const r = 9 * pulse * (1 + Math.max(0, t - T_FORM + 0.2) * 2);
        cx!.globalAlpha = clamp(a) * clamp(t / 0.4); cx!.drawImage(brandSprites[0], parts[0].sx - r * 3, parts[0].sy - r * 3, r * 6, r * 6);
      }
      for (const p of parts) {
        let x: number, y: number, al = 1, sz = p.size;
        if (t < p.d) continue;
        const f = clamp((t - p.d) / p.dur);
        if (t < T_DISP + p.e) {
          const u = ease(f), v = 1 - u;
          x = v * v * p.sx + 2 * v * u * p.cx + u * u * p.tx; y = v * v * p.sy + 2 * v * u * p.cy + u * u * p.ty;
          al = clamp(f * 5) * 0.55;
          if (f >= 1) { const s = Math.sin(t * 3 + p.ph); x += s * 1.2; y += Math.cos(t * 2.6 + p.ph) * 1.2; al = 0.5 + 0.12 * s; sz = p.size * (1 + 0.15 * s); }
        } else {
          const u = ease(clamp((t - T_DISP - p.e) / 1.4));
          const dx = Math.sin(t * p.sp + p.ph) * p.ax, dy = Math.cos(t * p.sp * 0.8 + p.ph) * p.ay;
          x = p.tx + (p.hx + dx - p.tx) * u; y = p.ty + (p.hy + dy - p.ty) * u;
          if (p.amb) { al = 0.35 + 0.35 * Math.sin(t * 1.3 + p.ph) + (1 - u) * 0.3; sz = p.size * (1.1 - 0.2 * u); } else al = clamp(1 - u * 1.15);
          const ddx = x - mx, ddy = y - my, d2 = ddx * ddx + ddy * ddy, R = 150;
          let px = 0, py = 0;
          if (d2 < R * R) { const dd = Math.sqrt(d2) || 1, k = (1 - dd / R) * 60; px = (ddx / dd) * k; py = (ddy / dd) * k; }
          p.ox += (px - p.ox) * 0.12; p.oy += (py - p.oy) * 0.12; x += p.ox; y += p.oy;
        }
        if (al <= 0.01) continue;
        const forming = t < T_DISP + p.e;
        const r = sz * (forming ? 2.6 : 3.2); cx!.globalAlpha = clamp(al) * dim;
        cx!.drawImage(forming || !p.amb ? brandSprites[p.c] : sprite!, x - r, y - r, r * 2, r * 2);
      }
      cx!.globalAlpha = 1; cx!.globalCompositeOperation = "source-over";
      // the crisp logo settles over the fireflies, then lets them go
      if (lightLogo && t > 2.4 && t < T_DISP + 0.6) {
        cx!.globalAlpha = clamp((t - 2.4) / 0.7) * (1 - clamp((t - T_DISP) / 0.5));
        cx!.drawImage(lightLogo, lx, ly, lw, lh);
        cx!.globalAlpha = 1;
      }
      word!.style.opacity = String(clamp((t - 2.6) / 0.7) * (1 - clamp((t - T_DISP - 0.1) / 0.5)));
      bg!.style.opacity = String(1 - clamp((t - T_UI + 0.4) / 1.1));
    }

    let stopped = false;
    let t0: number | null = null, offset = playIntro ? 0 : T_END + 1, uiShown = false, ended = false, raf = 0, trimmed = false;
    const showUI = () => { if (uiShown) return; uiShown = true; root.classList.remove("pre"); startReveal(); };
    const end = () => {
      if (ended) return; ended = true;
      bg.style.display = word.style.display = skipBtn.style.display = "none";
      cv.style.zIndex = "0";
      if (!trimmed) { trimmed = true; parts = parts.filter((p) => p.amb); } // keep only the background fireflies
      if (!ambient) { cv.style.display = "none"; stopped = true; } // intro only: no background fireflies afterwards
    };
    const loop = (now: number) => {
      if (t0 === null) t0 = now;
      const t = (now - t0) / 1000 + offset;
      frame(t);
      if (t > T_UI) showUI();
      if (t > T_END) end();
      if (stopped) return;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; };
    const onLeave = () => { mx = my = -999; };
    const onResize = () => { if (ended) build(false); };
    const onSkip = () => { if (t0 !== null) { const t = (performance.now() - t0) / 1000 + offset; if (t < T_DISP) offset += T_DISP - t; } };

    // ---- hero parallax ----
    const stage = root.querySelector<HTMLElement>(".stage");
    const onPar = (e: PointerEvent) => {
      if (!stage) return;
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      stage.querySelectorAll<HTMLElement>(".card3d").forEach((c, i) => {
        c.style.transform = `translate3d(calc(var(--tx) + ${x * (18 + i * 8)}px),calc(var(--ty) + ${y * 14}px),var(--tz)) rotateY(calc(var(--ry) + ${x * 8}deg)) rotateX(${-y * 6}deg)`;
      });
    };

    if (reduce) {
      bg.style.display = word.style.display = skipBtn.style.display = "none";
      cv.style.display = "none";
      root.classList.remove("pre");
      root.querySelectorAll(".rv").forEach((el) => el.classList.add("in"));
      return () => { io.disconnect(); root.removeEventListener("pointermove", onCardMove); };
    }
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      build(playIntro);
      if (!playIntro) end();
      raf = requestAnimationFrame(loop);
    };
    if (playIntro) {
      const img = new Image();
      img.onload = () => { try { sampleLogo(img); } catch {} start(); };
      img.onerror = start;
      img.src = "/logo-contrast.png";
    } else start();
    addEventListener("pointermove", onMove);
    addEventListener("pointermove", onPar);
    document.addEventListener("pointerleave", onLeave);
    addEventListener("resize", onResize);
    skipBtn.addEventListener("click", onSkip);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf); io.disconnect();
      root.removeEventListener("pointermove", onCardMove);
      removeEventListener("pointermove", onMove); removeEventListener("pointermove", onPar);
      document.removeEventListener("pointerleave", onLeave); removeEventListener("resize", onResize);
      skipBtn.removeEventListener("click", onSkip);
    };
  }, [rootSelector, ambient]);

  return (
    <>
      {ambient && <div className="gx-grid" aria-hidden="true" />}
      <canvas ref={cvRef} className="gx-fx" aria-hidden="true" />
      <div ref={bgRef} className="gx-introbg" aria-hidden="true" />
      <div ref={wordRef} className="gx-introword" aria-hidden="true">Empower your wellness, live better</div>
      <button ref={skipRef} type="button" className="gx-skip">Skip intro</button>
    </>
  );
}
