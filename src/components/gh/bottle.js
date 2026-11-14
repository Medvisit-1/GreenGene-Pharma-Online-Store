/* Homepage hero motion (approved demo, ported unchanged in look and feel):
   one shared slow movement for the realistic rotating Estrogene bottle and the leaf parallax.
   Framework-free so it can also be checked in a plain page. The bottle label is the REAL flat
   Estrogene label artwork (public/hero/estrogene-label-*.webp, exported from the owner's label file),
   wrapped once around the body: front panel facing the camera, Supplements Facts coming round as it turns.
   No label text is typed or generated here. */

const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js";
const LABEL_FRONT_U = 0.51; /* centre of the front panel on the flat label (0..1, left to right) */

/**
 * @param {{ hero: HTMLElement, host: HTMLElement, still: HTMLImageElement, leaves?: HTMLElement[],
 *           labelSrc: { big: string, small: string }, fixedAngle?: number, onReady?: () => void }} o
 * @returns {() => void} cleanup
 */
export function startHero(o) {
  const doc = document;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  const M = { tx: 0, ty: 0, x: 0, y: 0, ts: 0, s: 0 };
  const leaves = o.leaves || [];
  let renderBottle = null, heroOn = true, pageOn = true, lastT = 0, raf = 0, dead = false;
  const offs = [];
  const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); offs.push(() => t.removeEventListener(ev, fn, opt)); };
  const FRAME = small ? 32 : 0; /* phones render at about 30 fps to stay light */

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!heroOn || !pageOn) return; /* paused while the hero is off-screen or the tab is hidden */
    if (FRAME && t - lastT < FRAME) return;
    lastT = t;
    M.x += (M.tx - M.x) * 0.03; M.y += (M.ty - M.y) * 0.03; M.s += (M.ts - M.s) * 0.05;
    if (!small) for (let i = 0; i < leaves.length; i++) {
      const dp = +(leaves[i].dataset.depth || 1);
      leaves[i].style.transform = "translate3d(" + (-M.x * dp * 16).toFixed(2) + "px," + (-M.y * dp * 11 - M.s * dp * 46).toFixed(2) + "px,0) rotate(" + (M.x * dp * 3).toFixed(2) + "deg)";
    }
    if (renderBottle) renderBottle(t, M);
  }
  let io = null;
  if ("IntersectionObserver" in window) { io = new IntersectionObserver((es) => { heroOn = es[0].isIntersecting; }); io.observe(o.hero); }
  on(doc, "visibilitychange", () => { pageOn = !doc.hidden; });
  if (!reduced && !small) {
    on(window, "pointermove", (e) => { M.tx = (e.clientX / innerWidth - 0.5) * 2; M.ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
    on(window, "scroll", () => { M.ts = Math.min(scrollY / innerHeight, 1); }, { passive: true });
  }
  if (!reduced) raf = requestAnimationFrame(loop); /* auto-rotation runs on every device, phones included */

  /* lazy-load Three.js only after first paint; if anything fails the flat real pack shot simply stays */
  const loadThree = () => new Promise((res, rej) => {
    if (window.THREE) return res(window.THREE);
    let s = doc.querySelector('script[data-gh-three]');
    if (!s) { s = doc.createElement("script"); s.src = THREE_URL; s.async = true; s.crossOrigin = "anonymous"; s.dataset.ghThree = "1"; doc.head.appendChild(s); }
    s.addEventListener("load", () => (window.THREE ? res(window.THREE) : rej()));
    s.addEventListener("error", rej);
  });
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const go = () => {
    if (dead) return;
    Promise.all([loadThree(), loadImg(small ? o.labelSrc.small : o.labelSrc.big)])
      .then(([T, img]) => { if (!dead) { try { buildBottle(T, img); } catch (err) { o.host.classList.remove("ready"); renderBottle = null; } } })
      .catch(() => { /* keep pack shot */ });
  };
  const idle = () => { if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 2000 }); else setTimeout(go, 600); };
  if (doc.readyState === "complete") idle(); else on(window, "load", idle);

  /* The real flat label, wrapped once around the label cylinder at its true aspect (no stretching).
     The tiny leftover at the back (the seam) is filled with the label's own black. */
  function makeLabel(img, LW) {
    const LH = Math.round(LW / (6.2832 * 1.006 / 2.3)); /* canvas aspect = label cylinder circumference : height */
    const lw = Math.round(LH * img.naturalWidth / img.naturalHeight);
    const c = doc.createElement("canvas"); c.width = LW; c.height = LH;
    const x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    try { x.filter = "contrast(1.1) brightness(.94)"; } catch (e) {} /* keep the label blacks deep under studio light (as approved) */
    /* front panel centre placed where the camera looks when the turn starts (rotation START = -0.42) */
    const X = Math.round(-LABEL_FRONT_U * lw + (0.42 / 6.2832) * LW);
    x.drawImage(img, X, 0, lw, LH); x.drawImage(img, X + LW, 0, lw, LH);
    try { x.filter = "none"; } catch (e) {}
    const seam0 = X + lw, seam1 = X + LW;
    if (seam1 > seam0) {
      const p = x.getImageData(Math.max(0, seam0 - 3), Math.round(LH * 0.5), 1, 1).data;
      x.fillStyle = "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
      x.fillRect(seam0, 0, seam1 - seam0, LH);
    }
    return c;
  }

  function buildBottle(T, labelImg) {
    const host = o.host;
    const w = host.clientWidth, hgt = host.clientHeight; if (!w || !hgt) return;
    const label = makeLabel(labelImg, small ? 2048 : 4096);

    const rnd = new T.WebGLRenderer({ antialias: true, alpha: true });
    rnd.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    rnd.setSize(w, hgt, false);
    rnd.toneMapping = T.ACESFilmicToneMapping; rnd.toneMappingExposure = 1.12;
    rnd.outputColorSpace = T.SRGBColorSpace;
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(28, w / hgt, 2, 80);

    /* procedural studio: dark room with soft boxes, baked to a PMREM environment */
    const env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(44, 34, 44), new T.MeshBasicMaterial({ color: 0x040704, side: T.BackSide })));
    const box = (col, k, pw, ph, bx, by, bz) => {
      const m = new T.Mesh(new T.PlaneGeometry(pw, ph), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(bx, by, bz); m.lookAt(0, 1.8, 0); env.add(m);
    };
    box(0xfff0d8, 5.2, 4.5, 12, 9, 5, 9);
    box(0xdfe8ff, 1.5, 7, 10, -11, 3, 6);
    box(0xffffff, 3.2, 12, 3, 0, 15, 2);
    box(0xB8E356, 6.5, 4, 11, -9, 3, -10);
    box(0xB8E356, 3.2, 3, 9, 10, 2, -10);
    const pm = new T.PMREMGenerator(rnd); scene.environment = pm.fromScene(env, 0.03).texture; pm.dispose();

    const key = new T.DirectionalLight(0xffe9cc, 1.0); key.position.set(5, 6, 8); scene.add(key);
    const rim = new T.DirectionalLight(0xB8E356, 3.6); rim.position.set(-5, 3, -6); scene.add(rim);
    const rim2 = new T.DirectionalLight(0xB8E356, 1.4); rim2.position.set(6, 2, -6); scene.add(rim2);

    const cv = (s, draw) => { const c = doc.createElement("canvas"); c.width = c.height = s; draw(c.getContext("2d"), s); return new T.CanvasTexture(c); };
    const rough = cv(256, (x, s) => {
      x.fillStyle = "rgb(105,105,105)"; x.fillRect(0, 0, s, s);
      for (let i = 0; i < 70; i++) {
        const px = Math.random() * s, py = Math.random() * s, r = 14 + Math.random() * 46, g = x.createRadialGradient(px, py, 0, px, py, r);
        const v = Math.random() < 0.5 ? "70,70,70" : "165,165,165";
        g.addColorStop(0, "rgba(" + v + ",.22)"); g.addColorStop(1, "rgba(" + v + ",0)"); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
      }
    });
    rough.wrapS = rough.wrapT = T.RepeatWrapping; rough.repeat.set(2, 2);

    const lathe = (pts, seg) => new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), seg);
    const SEG = small ? 72 : 128;
    let i, a;
    const bp = [[0, 0.07], [0.5, 0.06], [0.8, 0.02], [0.86, 0], [0.93, 0.012], [0.975, 0.045], [0.995, 0.09], [1, 0.15], [1, 0.26], [1, 1.4], [1, 2.56], [1, 2.61]];
    for (i = 1; i <= 8; i++) { a = i / 8 * 1.4; bp.push([0.8 + 0.2 * Math.cos(a), 2.61 + 0.335 * Math.sin(a)]); }
    bp.push([0.838, 2.955], [0.848, 2.975], [0.848, 3.03], [0.835, 3.05], [0.71, 3.06], [0.7, 3.08], [0.7, 3.6], [0.685, 3.63],
      [0.64, 3.63], [0.625, 3.6], [0.625, 3.06], [0.76, 2.94], [0.955, 2.6], [0.955, 0.16], [0.9, 0.1], [0, 0.11]);
    const g = new T.Group();
    g.add(new T.Mesh(lathe(bp, SEG), new T.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: 0.5, roughnessMap: rough, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.15 })));

    /* label: the real full wrap-around artwork (mipmapped, anisotropic, sRGB) */
    const tex = new T.CanvasTexture(label);
    tex.colorSpace = T.SRGBColorSpace; tex.wrapS = T.RepeatWrapping;
    tex.generateMipmaps = true; tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter;
    tex.anisotropy = rnd.capabilities.getMaxAnisotropy();
    const lab = new T.Mesh(new T.CylinderGeometry(1.006, 1.006, 2.3, SEG, 1, true),
      new T.MeshPhysicalMaterial({ map: tex, roughness: 0.36, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.22, sheen: 0.08, sheenRoughness: 0.5, sheenColor: new T.Color(0xffffff), envMapIntensity: 0.7 }));
    lab.position.y = 1.41; g.add(lab);

    const RIBS = 64, cg = lathe([[0.74, 3.075], [0.806, 3.075], [0.816, 3.086], [0.816, 3.15], [0.802, 3.17], [0.8, 3.19], [0.8, 3.22], [0.8, 3.4], [0.8, 3.58], [0.8, 3.61],
      [0.794, 3.635], [0.772, 3.667], [0.72, 3.686], [0.4, 3.692], [0, 3.692]], RIBS * (small ? 4 : 6));
    const pos = cg.attributes.position;
    for (i = 0; i < pos.count; i++) {
      const y = pos.getY(i); if (y < 3.19 || y > 3.61) continue;
      const x = pos.getX(i), z = pos.getZ(i), e = Math.min((y - 3.19) / 0.03, (3.61 - y) / 0.03, 1);
      const k = 1 + 0.024 * e * Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(x, z) * RIBS), 0.7);
      pos.setX(i, x * k); pos.setZ(i, z * k);
    }
    cg.computeVertexNormals();
    g.add(new T.Mesh(cg, new T.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.44, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3 })));
    scene.add(g);

    const refl = g.clone(); refl.scale.y = -1; scene.add(refl);
    const fade = cv(256, (x, s) => {
      const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, "rgb(218,218,218)"); gr.addColorStop(0.5, "rgb(226,226,226)"); gr.addColorStop(1, "rgb(0,0,0)");
      x.fillStyle = "#000"; x.fillRect(0, 0, s, s); x.fillStyle = gr; x.fillRect(0, 0, s, s);
    });
    const floor = new T.Mesh(new T.CircleGeometry(9, 64), new T.MeshStandardMaterial({ color: 0x18381c, roughness: 0.5, metalness: 0.1, transparent: true, alphaMap: fade, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2; floor.renderOrder = 1; scene.add(floor);
    const blob = cv(256, (x, s) => {
      const gr = x.createRadialGradient(s / 2, s / 2, s * 0.2, s / 2, s / 2, s / 2);
      gr.addColorStop(0, "rgba(0,0,0,.9)"); gr.addColorStop(0.42, "rgba(0,0,0,.62)"); gr.addColorStop(0.7, "rgba(0,0,0,.2)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = gr; x.fillRect(0, 0, s, s);
    });
    const sh = new T.Mesh(new T.PlaneGeometry(4.6, 4.6), new T.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, toneMapped: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.004; sh.renderOrder = 2; scene.add(sh);

    const TURN = 50000, START = -0.42, t0 = performance.now(); /* one full turn every 50 seconds */
    const fixed = typeof o.fixedAngle === "number";
    const draw = (t, m) => {
      const ang = fixed ? o.fixedAngle : START + (reduced ? 0 : (t - t0) / TURN * 6.2832) + m.x * 0.4 + m.s * 0.8;
      g.rotation.y = ang; refl.rotation.y = ang;
      cam.position.set(-m.x * 0.35, 2.4 - m.y * 0.22, 11.8); cam.lookAt(0, 1.0, 0);
      rnd.render(scene, cam);
    };
    draw(t0, M); /* throws here if WebGL cannot draw: caller keeps the pack shot */
    host.appendChild(rnd.domElement);
    host.classList.add("ready");
    if (!reduced) renderBottle = draw;
    rnd.domElement.addEventListener("webglcontextlost", () => { renderBottle = null; host.classList.remove("ready"); });
    on(window, "resize", () => {
      const nw = host.clientWidth, nh = host.clientHeight; if (!nw || !nh) return;
      rnd.setSize(nw, nh, false); cam.aspect = nw / nh; cam.updateProjectionMatrix();
      if (reduced) draw(t0, M);
    });
    offs.push(() => { renderBottle = null; rnd.dispose(); rnd.domElement.remove(); host.classList.remove("ready"); });
    if (o.onReady) o.onReady();
  }

  return () => { dead = true; cancelAnimationFrame(raf); if (io) io.disconnect(); offs.splice(0).forEach((f) => f()); };
}

/** The combo banner's one slow drift. */
export function startDrift(sec, photo) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let ticking = false;
  const drift = () => {
    ticking = false;
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = (vh - r.top) / (vh + r.height) - 0.5;
    photo.style.transform = "translate3d(0," + (-p * 70).toFixed(1) + "px,0)";
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } };
  addEventListener("scroll", onScroll, { passive: true });
  drift();
  return () => removeEventListener("scroll", onScroll);
}
