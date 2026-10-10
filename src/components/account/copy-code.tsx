"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-plum-200 bg-white px-2.5 py-1 text-xs font-semibold text-plum-700 transition hover:bg-plum-50"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
