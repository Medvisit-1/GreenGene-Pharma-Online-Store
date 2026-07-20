"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { type NewReleaseCard, emptyCard } from "@/lib/new-release";

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

type Opt = { label: string; value: string };

/**
 * Repeatable "New Release" card editor. Each card has an image, title, text,
 * button label and link. The whole list is serialized into a single hidden
 * input (`newReleaseCards`) as JSON for the server action to store.
 */
export function NewReleaseEditor({
  name,
  initial,
  linkOptions,
}: {
  name: string;
  initial: NewReleaseCard[];
  linkOptions: Opt[];
}) {
  const [cards, setCards] = useState<NewReleaseCard[]>(initial);

  const update = (i: number, patch: Partial<NewReleaseCard>) =>
    setCards((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => setCards((cs) => cs.filter((_, idx) => idx !== i));
  const add = () => setCards((cs) => [...cs, emptyCard()]);
  const move = (i: number, dir: -1 | 1) =>
    setCards((cs) => {
      const j = i + dir;
      if (j < 0 || j >= cs.length) return cs;
      const next = [...cs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(cards)} />

      <div className="space-y-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-800">Card {i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  title="Move up" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === cards.length - 1}
                  title="Move down" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(i)}
                  title="Remove card" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <div>
                <label className={label}>Product image</label>
                <CardImage value={c.image} onChange={(url) => update(i, { image: url })} />
              </div>
              <div className="grid content-start gap-4">
                <div>
                  <label className={label}>Card heading</label>
                  <input value={c.title} onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="e.g. Discover Zenax" className={input} />
                </div>
                <div>
                  <label className={label}>Card text</label>
                  <textarea value={c.text} onChange={(e) => update(i, { text: e.target.value })}
                    rows={3} placeholder="Short description of the new product." className={input} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Button — text</label>
                <input value={c.buttonLabel} onChange={(e) => update(i, { buttonLabel: e.target.value })}
                  placeholder="e.g. Shop now" className={input} />
              </div>
              <div>
                <label className={label}>Button — link</label>
                <input value={c.buttonLink} onChange={(e) => update(i, { buttonLink: e.target.value })}
                  list="new-release-links" autoComplete="off"
                  placeholder="Type a product, pick a page, or paste a URL" className={input} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <datalist id="new-release-links">
        {linkOptions.map((o) => (
          <option key={o.value + o.label} value={o.value}>{o.label}</option>
        ))}
      </datalist>

      <button type="button" onClick={add}
        className="mt-4 flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
        <Plus className="h-4 w-4" /> Add card
      </button>
    </div>
  );
}

function CardImage({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) onChange(data.url);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-28 w-28 rounded-xl border border-border bg-white object-contain p-1" />
          <button type="button" onClick={() => onChange("")} title="Remove image"
            className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-center text-xs text-muted-foreground hover:bg-muted">
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-brand-500" /> : (<><UploadCloud className="h-5 w-5 text-brand-500" /> Upload</>)}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}
