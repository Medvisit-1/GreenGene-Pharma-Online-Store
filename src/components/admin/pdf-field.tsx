"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";

/** Upload a PDF (e.g. a product information pack); stores the URL in a hidden input. */
export function PdfField({ name, initial = "" }: { name: string; initial?: string }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) setUrl(data.url);
      else setError(data.error ?? "Upload failed.");
    } catch {
      setError("Upload failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="flex flex-wrap items-center gap-3">
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-muted">
            <FileText className="h-4 w-4" /> {url.split("/").pop()}
          </a>
          <button type="button" onClick={() => ref.current?.click()} className="text-sm font-semibold text-brand-700 hover:underline">
            Replace
          </button>
          <button type="button" onClick={() => setUrl("")} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline">
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex h-16 w-64 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-muted"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-brand-500" /> : <><UploadCloud className="h-5 w-5 text-brand-500" /> Upload PDF</>}
        </button>
      )}
      {busy && url && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </div>
  );
}
