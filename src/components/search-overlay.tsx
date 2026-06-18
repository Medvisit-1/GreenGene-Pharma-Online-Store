"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    onClose();
    setQ("");
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-surface shadow-xl transition-transform duration-200",
          open ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <form onSubmit={submit} className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5">
          <Search className="h-5 w-5 shrink-0 text-brand-500" />
          <input
            autoFocus={open}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
