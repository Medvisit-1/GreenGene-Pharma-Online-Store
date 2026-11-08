"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ProductImg } from "@/components/night/pic";

// ---------- Goal rail + showcase (picking a goal shifts the page colour) ----------

export type GoalData = {
  name: string;
  href: string;
  rgb: string;
  icon: "women" | "bolt" | "mind" | "skin" | "men" | "leaf";
  product: { title: string; desc: string; price: string; was?: string; img?: string; href: string } | null;
};

const ICONS: Record<GoalData["icon"], React.ReactNode> = {
  women: <><circle cx="12" cy="9" r="5" /><path d="M12 14v8M8.5 18h7" /></>,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />,
  mind: <path d="M12 21c-5-3-8-6-8-10a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 4-3 7-8 10Z" />,
  skin: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  men: <><circle cx="10" cy="14" r="5" /><path d="M14 10l6-6M15 4h5v5" /></>,
  leaf: <path d="M12 21V11M12 11c0-5-4-8-9-8 0 5 3 8 9 8Zm0 3c0-4 3-7 9-7 0 5-3 8-9 8Z" />,
};

export function GoalShowcase({ goals }: { goals: GoalData[] }) {
  const [i, setI] = useState(0);
  const [k, setK] = useState(0);
  const g = goals[i];
  function pick(n: number) {
    setI(n);
    setK((v) => v + 1);
    const root = document.querySelector<HTMLElement>(".gx");
    if (root) root.style.setProperty("--acc-rgb", goals[n].rgb);
  }
  if (!g) return null;
  return (
    <>
      <div className="rail rv" role="tablist" aria-label="Shop by goal">
        {goals.map((x, n) => (
          <span key={x.name} style={{ display: "contents" }}>
            {n > 0 && <span className="link" aria-hidden="true" />}
            <button type="button" role="tab" aria-selected={n === i} className={`goal${n === i ? " on" : ""}`} onClick={() => pick(n)}>
              <span className="ic"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[x.icon]}</svg></span>
              {x.name}
            </button>
          </span>
        ))}
      </div>
      <div className="frame show rv">
        <i className="dot" /><i className="dot" /><i className="dot" /><i className="dot" />
        <div className="copy swap" key={`c${k}`}>
          <span className="eyebrow left" style={{ color: "rgb(var(--acc-rgb))" }}>{g.name}</span>
          {g.product ? (
            <>
              <h3>{g.product.title}</h3>
              <p>{g.product.desc}</p>
              <div className="price">{g.product.price}{g.product.was && <s>{g.product.was}</s>}</div>
              <div><Link className="btn p" href={g.product.href}>View product →</Link></div>
            </>
          ) : (
            <>
              <h3>{g.name}</h3>
              <div><Link className="btn p" href={g.href}>Browse the range →</Link></div>
            </>
          )}
        </div>
        <div className="vis swap" key={`v${k}`}>
          {g.product?.img && <ProductImg src={g.product.img} alt={g.product.title} sizes="260px" />}
        </div>
      </div>
    </>
  );
}

// ---------- Daily routine checklist (remembered on this device for today) ----------

const EVENT = "gg-routine";
const dayKey = (id: string) => `gg-routine:${new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })}:${id}`;
const sub = (cb: () => void) => {
  addEventListener(EVENT, cb);
  addEventListener("storage", cb);
  return () => { removeEventListener(EVENT, cb); removeEventListener("storage", cb); };
};

export type RoutineItem = { id: string; name: string; sub: string; img?: string };

export function RoutineList({ items }: { items: RoutineItem[] }) {
  const snap = useSyncExternalStore(
    sub,
    () => items.map((x) => { try { return localStorage.getItem(dayKey(x.id)) === "1" ? "1" : "0"; } catch { return "0"; } }).join(""),
    () => items.map(() => "0").join("")
  );
  const done = snap.split("").map((c) => c === "1");
  const n = done.filter(Boolean).length;
  function toggle(id: string, on: boolean) {
    try {
      if (on) localStorage.removeItem(dayKey(id));
      else localStorage.setItem(dayKey(id), "1");
    } catch {}
    dispatchEvent(new Event(EVENT));
  }
  return (
    <>
      <div className="prog"><span>{n} of {items.length} today</span><i><b style={{ width: `${items.length ? (n / items.length) * 100 : 0}%` }} /></i></div>
      {items.map((x, i) => (
        <button key={x.id} type="button" className={`chk${done[i] ? " done" : ""}`} aria-pressed={done[i]} onClick={() => toggle(x.id, done[i])}>
          {x.img ? <ProductImg src={x.img} alt="" sizes="46px" /> : <span className="ph" />}
          <span className="t">{x.name}<small>{x.sub}</small></span>
          <span className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg></span>
        </button>
      ))}
    </>
  );
}

// ---------- Personal welcome ----------

const NAME_KEY = "gg-name";
const cleanName = (v: string) => v.replace(/[^\p{L}\p{M}' -]/gu, "").trim().split(/\s+/)[0]?.slice(0, 24) ?? "";

export function Welcome({ accountName, signedIn }: { accountName?: string; signedIn: boolean }) {
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
    <>
      <h1 className="rv in">
        {name ? <>Welcome back, <em>{name}</em></> : <>Welcome to <em>GreenGene</em></>}
      </h1>
      <p className="script rv">your path to healthy living</p>
      {!signedIn && ready && (
        <div className="namebar">
          {editing ? (
            <form onSubmit={save}>
              <label className="sr-only" htmlFor="gx-name">Your first name</label>
              <input id="gx-name" name="name" defaultValue={name} placeholder="Your first name" autoComplete="given-name" maxLength={24} autoFocus />
              <button type="submit" className="btn p sm">Save</button>
            </form>
          ) : name ? (
            <>Not {name}? <button type="button" className="tl" onClick={() => setEditing(true)}>Change name</button></>
          ) : (
            <button type="button" className="tl" onClick={() => setEditing(true)}>What should we call you?</button>
          )}
        </div>
      )}
    </>
  );
}
