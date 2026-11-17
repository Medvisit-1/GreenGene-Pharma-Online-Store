"use client";
/* eslint-disable @next/next/no-img-element -- small product thumbnails from the store uploads */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { startHero, startDrift, startAmbient } from "./bottle.js";

const LABEL_FAST = "/hero/estrogene-label-1024.webp";

/* ---------- hero: rotating Estrogene bottle + leaf parallax ---------- */
export function HeroMotion() {
  /* The real pack shot shows first; the 3D bottle mounts once the page is idle (all devices, phones included).
     bottle.js lowers pixel ratio and frame rate on weak devices and pauses off-screen or in a hidden tab. */
  useEffect(() => {
    const hero = document.getElementById("gh-hero"), host = document.getElementById("bottleHost");
    const still = document.getElementById("bottleStill") as HTMLImageElement | null;
    if (!hero || !host || !still) return;
    const leaves = Array.from(hero.querySelectorAll<HTMLElement>(".leaf"));
    let stop: (() => void) | undefined;
    const go = () => {
      stop = startHero({
        hero, host, still, leaves,
        labelSrc: { fast: LABEL_FAST, big: "/hero/estrogene-label-4096.webp", small: "/hero/estrogene-label-2048.webp" },
      });
    };
    /* Start right after the first paint (no idle wait): the files are already preloaded from <head>. */
    let off = false; const id = window.requestAnimationFrame(() => window.requestAnimationFrame(() => { if (!off) go(); }));
    return () => {
      off = true; window.cancelAnimationFrame(id);
      stop?.();
    };
  }, []);
  return null;
}

/* ---------- scroll rise: blocks slide/fade in as they enter view (phones and desktop) ---------- */
export function ScrollReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".gh");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".rv"));
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    /* blocks already on screen stay put; the rest wait below the fold */
    els.forEach((el, i) => { if (el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add("in"); else { el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); } });
    root.classList.add("rv-on");
    /* safety net: never leave anything hidden */
    const t = window.setTimeout(() => els.forEach((el) => { if (!el.classList.contains("in") && el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }), 4000);
    return () => { io.disconnect(); clearTimeout(t); root.classList.remove("rv-on"); };
  }, []);
  return null;
}

/* ---------- subtle scroll-linked background drift: one soft element per section ---------- */
export function ScrollAmbient() {
  useEffect(() => startAmbient(Array.from(document.querySelectorAll<HTMLElement>(".gh .amb"))), []);
  return null;
}

/* ---------- combo banner: the one slow drift ---------- */
export function ComboDrift() {
  useEffect(() => {
    const sec = document.getElementById("gh-combo"), photo = document.getElementById("comboPhoto");
    if (!sec || !photo) return;
    return startDrift(sec, photo);
  }, []);
  return null;
}

/* ---------- greeting: only for signed-in customers; visitors get a sign-up link ---------- */
export function Greeting({ greeting, accountName, signedIn }: { greeting: string; accountName?: string; signedIn: boolean }) {
  return (
    <p className="greet">
      {signedIn ? (
        <>
          <span>{greeting}{accountName ? `, ${accountName}` : ""}</span>
          <span className="badge">Member</span>
        </>
      ) : (
        <span>Welcome to GreenGene</span>
      )}
    </p>
  );
}

/* ---------- three-question quiz (products, prices and stock are the store's live data) ---------- */
export type QuizProduct = { name: string; price: string; was?: string; inStock: boolean; img?: string; href: string; line: string };
export type QuizData = { products: Record<string, QuizProduct | undefined>; tips: [string, string, string] };

const QS = [
  { q: "What is your goal?", opts: ["Shine Bright", "Gut Health", "Women’s Health", "Energy & Vitality", "Mind & Mood", "Men’s Performance"] },
  { q: "How do your days usually feel?", opts: ["Active. I train or move most days", "Busy. Long days, little time for me", "Winding down is the hard part"], one: true },
  { q: "How well do you know GreenGene?", opts: ["New here", "I have tried one product", "I am a regular"], one: true },
];

function pick(a: number[], P: QuizData["products"]) {
  const [goal, life, exp] = a;
  let ids: string[] = [], note = "";
  if (goal === 0) ids = ["glow"];
  else if (goal === 1) { ids = ["soul"]; note = "An honest note: GreenGene does not make a dedicated gut-health formula yet. The closest product is Soul, a calm and clarity formula."; }
  else if (goal === 2) ids = [exp === 2 ? "combo" : life === 0 ? "estrolean" : "estrogene", "estrogene", "estrolean", "combo"];
  else if (goal === 3) {
    ids = ["estrolean"];
    const menIn = ["anabolean", "mangene"].filter((k) => P[k]?.inStock).map((k) => P[k]!.name);
    note = "EstroLean is formulated for women. " + (menIn.length ? `For men, have a look at ${menIn.join(" or ")}.` : "The men’s formulas, AnaboLean and ManGene, are sold out right now.");
  } else if (goal === 4) ids = [life === 0 ? "lions" : life === 2 ? "zenax" : "soul", "soul"];
  else ids = [life === 0 ? "anabolean" : "mangene", "anabolean", "mangene"];
  const list = ids.map((k) => P[k]).filter(Boolean) as QuizProduct[];
  const main = list[0];
  if (!main) return null;
  let alt: QuizProduct | null = null;
  if (!main.inStock) {
    alt = list.find((p) => p.inStock && p !== main) ?? null;
    note = `${main.name} is sold out right now. ` + (alt ? `The closest product in stock is ${alt.name}.` : goal === 5
      ? "No men’s formula is in stock at the moment, so we would rather not point you to something that does not fit. The product page has a back-in-stock email alert."
      : "The product page has a back-in-stock email alert.");
  }
  return { main, alt, note };
}

export function Quiz({ data }: { data: QuizData }) {
  const [shown, setShown] = useState<number[]>([]);
  const [fade, setFade] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function go(next: number[]) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(next); return; }
    setFade(true);
    timer.current = setTimeout(() => { setShown(next); setFade(false); }, 560);
  }
  const i = shown.length;
  const step = Math.min(i, 2);
  const r = i >= 3 ? pick(shown, data.products) : null;
  const show = r ? r.alt ?? r.main : null;
  return (
    <div className="quiz-panel rv">
      <div className="quiz-head">
        <span className="glass-pill">Find your formula</span>
        <h2>Three questions.<br />One <em>honest</em> answer.</h2>
        <p className="lede">Tell us what matters to you. Three taps, no sign-up, and we will point you to one GreenGene product to start with.</p>
        <p className="quiz-steps" aria-hidden="true">{[0, 1, 2].map((s) => <i key={s} className={s <= step ? "on" : ""} />)}</p>
      </div>
      <div className={`quiz-body${fade ? " fade" : ""}`} aria-live="polite">
        {i < 3 ? (
          <>
            <p className="q-num">Question {i + 1} of 3</p>
            <p className="q-text">{QS[i].q}</p>
            <div className={`q-opts${QS[i].one ? " one" : ""}`}>
              {QS[i].opts.map((o, n) => <button key={o} className="q-opt" type="button" onClick={() => go([...shown, n])}>{o}</button>)}
            </div>
          </>
        ) : r && show ? (
          <div className="res">
            <div className="res-img">{show.img && <img src={show.img} alt={show.name} loading="lazy" />}</div>
            <div>
              <p className="q-num">{r.alt ? "Closest in stock" : r.main.inStock ? "Your starting point" : "Sold out right now"}</p>
              <h3>{show.name}</h3>
              <p className="res-price">{show.price}{show.was && <s>{show.was}</s>}</p>
              {r.note && <p className="res-note">{r.note}</p>}
              {show.line && <p className="res-line">{show.line}</p>}
              <p className="res-tip">{data.tips[shown[2]] ?? ""}</p>
              <div className="res-actions">
                <Link className="btn btn-primary" href={show.href}>View product</Link>
                {r.alt && <Link className="again" href={r.main.href}>See {r.main.name}</Link>}
                <button className="again" type="button" onClick={() => go([])}>Start again</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="res-actions"><Link className="btn btn-primary" href="/products">Browse all products</Link><button className="again" type="button" onClick={() => go([])}>Start again</button></div>
        )}
      </div>
    </div>
  );
}

/* ---------- daily routine tracker (same per-day storage as before, so existing ticks are kept) ---------- */
const EVENT = "gg-routine";
const dayKey = (id: string) => `gg-routine:${new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })}:${id}`;
const sub = (cb: () => void) => {
  addEventListener(EVENT, cb);
  addEventListener("storage", cb);
  return () => { removeEventListener(EVENT, cb); removeEventListener("storage", cb); };
};
export type RoutineRow = { id: string; title: string; sub: string; img?: string };

export function Routine({ items }: { items: RoutineRow[] }) {
  const snap = useSyncExternalStore(
    sub,
    () => items.map((x) => { try { return localStorage.getItem(dayKey(x.id)) === "1" ? "1" : "0"; } catch { return "0"; } }).join(""),
    () => items.map(() => "0").join("")
  );
  const done = snap.split("").map((c) => c === "1");
  const n = done.filter(Boolean).length;
  function toggle(id: string, on: boolean) {
    try { if (on) localStorage.removeItem(dayKey(id)); else localStorage.setItem(dayKey(id), "1"); } catch {}
    dispatchEvent(new Event(EVENT));
  }
  return (
    <>
      <p className="counter"><b>{n}</b> of {items.length} today</p>
      <ul className="rows">
        {items.map((x, i) => (
          <li key={x.id}>
            <button className="row" type="button" role="checkbox" aria-checked={done[i]} onClick={() => toggle(x.id, done[i])}>
              <span className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
              <span className="row-img">{x.img && <img src={x.img} alt="" loading="lazy" />}</span>
              <span><span className="row-t">{x.title}</span><span className="row-s">{x.sub}</span></span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
