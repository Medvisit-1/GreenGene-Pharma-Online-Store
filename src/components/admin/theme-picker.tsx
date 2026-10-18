"use client";

import { useState } from "react";
import { Check, Gift, Search } from "lucide-react";
import { THEME_PRESETS, type ThemeColors } from "@/lib/themes";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: "primary", label: "Main colour", hint: "Headings, rewards card, footer, buttons" },
  { key: "accent", label: "Highlight", hint: "Progress ring, badges, gold touches" },
  { key: "secondary", label: "Second colour", hint: "Offer slide, refill card, leaves, Add to cart" },
  { key: "background", label: "Background", hint: "The page behind everything" },
  { key: "ink", label: "Text", hint: "Body text" },
];

const mix = (a: string, pct: number, b: string) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;

/** A small live mock of the homepage in the chosen colours. */
function Preview({ c }: { c: ThemeColors }) {
  const card = mix(c.background, 40, "#fff");
  return (
    <div className="overflow-hidden rounded-[22px] p-4 shadow-inner" style={{ background: c.background, color: c.ink }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-[family-name:var(--font-g-serif)] text-lg font-bold" style={{ color: c.primary }}>GreenGene</span>
        <span className="flex gap-1 rounded-full p-1 text-[10px] font-medium" style={{ background: card }}>
          <span className="rounded-full px-2 py-1 text-white" style={{ background: c.primary }}>Home</span>
          <span className="px-2 py-1 opacity-60">Shop</span>
          <span className="px-2 py-1 opacity-60">Rewards</span>
        </span>
      </div>
      <div className="grid grid-cols-[1.3fr_1fr] gap-2.5">
        <div className="rounded-2xl p-4" style={{ background: `linear-gradient(140deg, ${mix(c.background, 55, "#fff")}, ${c.background} 60%, ${mix(c.background, 88, c.primary)})` }}>
          <p className="text-[9px] font-semibold uppercase tracking-[.2em]" style={{ color: mix(c.primary, 70, "#fff") }}>Good morning</p>
          <p className="font-[family-name:var(--font-g-serif)] text-2xl font-semibold leading-none" style={{ color: c.primary }}>Welcome back, Thandi</p>
          <p className="font-[family-name:var(--font-g-script)] text-base" style={{ color: mix(c.secondary, 86, "#fff") }}>your path to healthy living</p>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[10px] opacity-80"><Search className="h-3 w-3" /> Search…</div>
        </div>
        <div className="rounded-2xl p-3.5 text-white" style={{ background: `radial-gradient(120% 100% at 85% 0%, ${mix(c.primary, 80, "#fff")} 0%, ${c.primary} 55%, ${mix(c.primary, 76, "#000")} 100%)` }}>
          <p className="text-[9px] font-semibold uppercase tracking-[.2em]" style={{ color: c.accent }}>Rewards</p>
          <p className="font-[family-name:var(--font-g-serif)] text-base font-semibold leading-tight">One more order to your next reward</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full border-[3px] text-[10px] font-bold" style={{ borderColor: c.accent }}>2/3</span>
            <Gift className="h-5 w-5" style={{ color: c.accent }} />
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-between rounded-2xl p-3.5" style={{ background: `radial-gradient(110% 120% at 80% 50%, ${mix(c.secondary, 86, "#fff")}, ${c.secondary} 55%, ${mix(c.secondary, 66, "#000")})`, color: mix(c.background, 100, "#fff") }}>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.2em]" style={{ color: c.accent }}>Limited offer</p>
            <p className="font-[family-name:var(--font-g-serif)] text-lg font-semibold text-white">AnaboLean now R260</p>
          </div>
          <span className="rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ background: c.accent, color: c.secondary }}>Shop the offer</span>
        </div>
        <div className="col-span-2 flex items-center justify-between rounded-2xl px-3.5 py-3" style={{ background: c.primary }}>
          <span className="font-[family-name:var(--font-g-script)] text-lg text-white">Join today. Start saving.</span>
          <span className="rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ background: c.accent, color: c.primary }}>Join free</span>
        </div>
      </div>
    </div>
  );
}

export function ThemePicker({ current, custom }: { current: string; custom: ThemeColors }) {
  const [preset, setPreset] = useState(current);
  const [colors, setColors] = useState<ThemeColors>(custom);
  const active = preset === "custom" ? colors : THEME_PRESETS.find((t) => t.id === preset)?.colors ?? THEME_PRESETS[0].colors;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
      <div className="space-y-6">
        <input type="hidden" name="preset" value={preset} />
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2>Themes</h2>
          <p className="mb-4 text-xs text-muted-foreground">Pick a ready-made colour scheme. It changes the whole shop — every page, the header and the footer. Emails and this admin keep their own colours.</p>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {THEME_PRESETS.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setPreset(t.id)}
                aria-pressed={preset === t.id}
                className={cn(
                  "relative rounded-2xl bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                  preset === t.id ? "ring-2 ring-[#5c1a3b]" : "ring-1 ring-border"
                )}
              >
                {preset === t.id && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#5c1a3b] text-white"><Check className="h-3.5 w-3.5" /></span>}
                <div className="flex h-12 overflow-hidden rounded-xl">
                  <span className="flex-[3]" style={{ background: t.colors.primary }} />
                  <span className="flex-[2]" style={{ background: t.colors.secondary }} />
                  <span className="flex-1" style={{ background: t.colors.accent }} />
                  <span className="flex-[2]" style={{ background: t.colors.background }} />
                </div>
                <p className="mt-3 font-[family-name:var(--font-g-serif)] text-xl font-semibold" style={{ color: t.colors.primary }}>{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.mood}</p>
              </button>
            ))}
          </div>
        </section>

        <section className={cn("rounded-2xl border bg-surface p-5", preset === "custom" ? "border-[#5c1a3b]" : "border-border")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2>Your own colours</h2>
              <p className="text-xs text-muted-foreground">Mix your own. Every tint, shade and gradient is worked out from these five.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (preset !== "custom") setColors(active);
                setPreset("custom");
              }}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold", preset === "custom" ? "bg-[#5c1a3b] text-white" : "border border-border bg-white")}
            >
              {preset === "custom" ? "Using your colours" : "Start from this theme"}
            </button>
          </div>
          <div className={cn("mt-4 grid gap-3 sm:grid-cols-2", preset !== "custom" && "pointer-events-none opacity-50")}>
            {FIELDS.map((f) => (
              <label key={f.key} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <input
                  type="color"
                  name={f.key}
                  value={colors[f.key]}
                  onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                  aria-label={f.label}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{f.label} <span className="font-mono text-xs font-normal text-muted-foreground">{colors[f.key]}</span></span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3">Live preview</h2>
          <Preview c={active} />
          <button type="submit" className="mt-4 w-full rounded-full bg-[#5c1a3b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4b1a37]">
            Apply to my shop
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">You can switch back any time.</p>
        </section>
      </div>
    </div>
  );
}
