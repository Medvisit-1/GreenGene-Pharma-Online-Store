"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Star, Loader2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageUploader({ initial = [] }: { initial?: string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setUploading(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload failed");
          continue;
        }
        added.push(data.url);
      } catch {
        setError("Upload failed. Please try again.");
      }
    }
    setImages((prev) => [...prev, ...added]);
    setUploading(false);
  }

  const remove = (url: string) => setImages((prev) => prev.filter((u) => u !== url));
  const makeMain = (url: string) =>
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  const addUrl = () => {
    const u = urlInput.trim();
    if (u) {
      setImages((prev) => [...prev, u]);
      setUrlInput("");
    }
  };

  return (
    <div>
      {/* hidden field consumed by saveProduct server action */}
      <input type="hidden" name="images" value={images.join("\n")} />

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragOver ? "border-brand-500 bg-brand-50" : "border-border bg-white hover:bg-muted"
        )}
      >
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
        ) : (
          <UploadCloud className="h-7 w-7 text-brand-500" />
        )}
        <p className="mt-2 text-sm font-medium">
          {uploading ? "Uploading…" : "Click to upload or drag images here"}
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF or AVIF · up to 6 MB each</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Previews */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-contain p-1.5" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Main
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/55 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeMain(url)}
                    title="Set as main image"
                    className="rounded p-1 text-white hover:text-accent"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(url)}
                  title="Remove"
                  className="ml-auto rounded p-1 text-white hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add by URL (optional) */}
      <div className="mt-3 flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-muted-foreground" />
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
          placeholder="…or paste an image URL"
          className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={addUrl}
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Add
        </button>
      </div>
    </div>
  );
}
