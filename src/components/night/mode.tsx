"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Runs before first paint (inline in the layout) so there is no light/dark flash. */
export const MODE_SCRIPT =
  "(function(){try{var m=localStorage.getItem('gg-mode');if(m!=='light'&&m!=='dark')m='dark';document.documentElement.dataset.mode=m}catch(e){}})();";

/** Light / dark switch for the storefront header. The choice is remembered on this device. */
export function ModeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<"light" | "dark" | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the mode the inline script chose
    setMode(document.documentElement.dataset.mode === "dark" ? "dark" : "light");
  }, []);
  function flip() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.dataset.mode = next;
    try {
      localStorage.setItem("gg-mode", next);
    } catch {}
  }
  return (
    <button type="button" onClick={flip} className={className} aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={mode === "dark" ? "Light mode" : "Dark mode"}>
      {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
