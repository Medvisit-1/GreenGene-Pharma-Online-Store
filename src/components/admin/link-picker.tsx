"use client";

import { useEffect, useRef, useState } from "react";

type Opt = { label: string; value: string };

const inputCls =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

/**
 * A link field with a searchable dropdown of site pages + products, that also
 * accepts a freely-typed custom URL. The input value IS the submitted link.
 */
export function LinkPicker({
  name,
  initial = "",
  options,
}: {
  name: string;
  initial?: string;
  options: Opt[];
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = value.trim().toLowerCase();
  const matches = (
    q
      ? options.filter(
          (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
        )
      : options
  ).slice(0, 10);

  return (
    <div className="relative" ref={ref}>
      <input
        name={name}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type a product, pick a page, or paste a custom link"
        className={inputCls}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg">
          {matches.map((o) => (
            <li key={o.value + o.label}>
              <button
                type="button"
                onClick={() => {
                  setValue(o.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-brand-50"
              >
                <span className="truncate font-medium text-brand-800">{o.label}</span>
                <span className="shrink-0 truncate text-xs text-muted-foreground">{o.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
