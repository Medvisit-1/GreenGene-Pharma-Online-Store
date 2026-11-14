"use client";
/* eslint-disable @next/next/no-img-element -- small product thumbnails from the store uploads */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import ReactDOM from "react-dom";
import { startHero, startDrift, startAmbient, THREE_URL } from "./bottle.js";

const LABEL_FAST = "/hero/estrogene-label-1024.webp";

/* ---------- hero: rotating Estrogene bottle + leaf parallax ---------- */
export function HeroMotion() {
  /* emitted into <head> during server render: Three.js and the small first-pass label start downloading
     with the HTML, so the 3D bottle can draw its first frame as soon as the page is interactive */
  ReactDOM.preconnect("https://cdnjs.cloudflare.com", { crossOrigin: "anonymous" });
  ReactDOM.preload(THREE_URL, { as: "script", crossOrigin: "anonymous", fetchPriority: "high" });
  ReactDOM.preload(LABEL_FAST, { as: "image", type: "image/webp", fetchPriority: "high" });
  useEffect(() => {
    const hero = document.getElementById("gh-hero"), host = document.getElementById("bottleHost");
    const still = document.getElementById("bottleStill") as HTMLImageElement | null;
    if (!hero) return;
    const leaves = Array.from(hero.querySelectorAll<HTMLElement>(".leaf"));
    if (!host || !still) return;
    return startHero({
      hero, host, still, leaves,
      labelSrc: { fast: LABEL_FAST, big: "/hero/estrogene-label-4096.webp", small: "/hero/estrogene-label-2048.webp" },
    });
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

/* ---------- personalised greeting (signed-in name, or the name saved on this device) ---------- */
const NAME_KEY = "gg-name";
const cleanName = (v: string) => v.replace(/[^\p{L}\p{M}' -]/gu, "").trim().split(/\s+/)[0]?.slice(0, 24) ?? "";

export function Greeting({ greeting, accountName, signedIn }: { greeting: string; accountName?: string; signedIn: boolean }) {
  const [name, setName] = useState(accountName ?? "");
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(signedIn);
  useEffect(() => {
    if (signedIn) return;
    let saved = "";
    try { saved = localStorage.getItem(NAME_KEY) ?? ""; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the name saved on this device after hydration
    if (saved) setName(saved);
    setReady(true);
  }, [signedIn]);
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = cleanName(String(new FormData(e.currentTarget).get("name") ?? ""));
    try { if (v) localStorage.setItem(NAME_KEY, v); else localStorage.removeItem(NAME_KEY); } catch {}
    setName(v);
    setEditing(false);
  }
  return (
    <p className="greet">
      <span>{greeting}{name ? `, ${name}` : ""}</span>
      {signedIn && <span className="badge">Member</span>}
      {!signedIn && ready && (editing ? (
        <form onSubmit={save}>
          <label className="sr" htmlFor="gh-name">Your first name</label>
          <input id="gh-name" name="name" defaultValue={name} placeholder="Your first name" autoComplete="given-name" maxLength={24} autoFocus />
          <button type="submit" className="mini">Save</button>
        </form>
      ) : (
        <button type="button" className="greet-edit" onClick={() => setEditing(true)}>{name ? `Not ${name}? Change name` : "What should we call you?"}</button>
      ))}
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
