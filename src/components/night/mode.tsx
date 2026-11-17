"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModeChoice = "system" | "light" | "dark";
const KEY = "gg-mode";
const BG = { light: "#F4F6F0", dark: "#0A0E09" };

/**
 * Runs inline before first paint, so there is no flash of the wrong theme.
 * No saved choice (or "system") = follow the phone/computer setting, and keep following it live.
 * A saved "light" / "dark" is a manual override remembered on this device.
 */
export const MODE_SCRIPT =
  "(function(){var d=document.documentElement,q;function a(){var m=null;try{m=localStorage.getItem('gg-mode')}catch(e){}var s=m==='light'||m==='dark'?m:(q&&q.matches?'dark':'light');d.dataset.mode=s;d.dataset.theme=s;d.dataset.modeChoice=m==='light'||m==='dark'?m:'system';d.style.colorScheme=s;var t=document.querySelector('meta[name=theme-color]');if(!t){t=document.createElement('meta');t.name='theme-color';document.head.appendChild(t)}t.setAttribute('content',s==='dark'?'" +
  BG.dark +
  "':'" +
  BG.light +
  "')}try{q=matchMedia('(prefers-color-scheme: dark)');q.addEventListener&&q.addEventListener('change',a)}catch(e){}a();window.__ggMode=a})();";

function readChoice(): ModeChoice {
  const c = document.documentElement.dataset.modeChoice;
  return c === "light" || c === "dark" ? c : "system";
}

/** Save the choice and re-apply the theme straight away. */
export function setModeChoice(choice: ModeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {}
  const apply = (window as unknown as { __ggMode?: () => void }).__ggMode;
  if (apply) apply();
  else { const m = choice === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : choice; document.documentElement.dataset.mode = m; document.documentElement.dataset.theme = m; document.documentElement.style.colorScheme = m; }
  window.dispatchEvent(new Event("gg-mode"));
}

function useMode() {
  const [mode, setMode] = useState<"light" | "dark" | null>(null);
  const [choice, setChoice] = useState<ModeChoice>("system");
  useEffect(() => {
    const sync = () => {
      setMode(document.documentElement.dataset.mode === "dark" ? "dark" : "light");
      setChoice(readChoice());
    };
    sync();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("gg-mode", sync);
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("gg-mode", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);
  return { mode, choice };
}

/** Desktop header switch: flips light/dark and remembers it (the "System" option lives in the phone menu). */
export function ModeToggle({ className }: { className?: string }) {
  const { mode } = useMode();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <button type="button" onClick={() => setModeChoice(next)} className={className} aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={mode === "dark" ? "Light mode" : "Dark mode"}>
      {mode === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

/** System / Light / Dark segmented control (phone "More" sheet). */
export function ModeChooser({ className }: { className?: string }) {
  const { choice } = useMode();
  const opts: { v: ModeChoice; label: string; Icon: typeof Sun }[] = [
    { v: "system", label: "System", Icon: Monitor },
    { v: "light", label: "Light", Icon: Sun },
    { v: "dark", label: "Dark", Icon: Moon },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("gg-modechooser", className)}>
      {opts.map(({ v, label, Icon }) => (
        <button key={v} type="button" role="radio" aria-checked={choice === v} onClick={() => setModeChoice(v)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
