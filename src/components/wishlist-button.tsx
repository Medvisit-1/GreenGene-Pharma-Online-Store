"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  /** Known saved state from the server (account page); otherwise loaded lazily. */
  initial?: boolean;
  variant?: "icon" | "pill" | "text";
  className?: string;
};

export function WishlistButton({ productId, initial, variant = "icon", className }: Props) {
  const router = useRouter();
  const { status, signedIn, ids, load, set } = useWishlist();
  useEffect(() => load(), [load]);

  const saved = status === "ready" ? ids.includes(productId) : !!initial;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Not signed in: sign in first, then come straight back with the product saved
    const askToSignIn = () => {
      const here = window.location.pathname + window.location.search;
      router.push(`/account?next=${encodeURIComponent(here)}&save=${encodeURIComponent(productId)}`);
    };
    if (status === "ready" && !signedIn) return askToSignIn();
    const res = await set(productId, !saved);
    if (res.signedOut) return askToSignIn();
    if (!res.ok) {
      toast.error(res.error ?? "Couldn't update your wishlist.");
      return;
    }
    if (variant === "text") router.refresh();
    else toast.success(saved ? "Removed from wishlist" : "Saved to your wishlist", {
      action: saved ? undefined : { label: "View", onClick: () => router.push("/account?tab=wishlist") },
    });
  };

  const label = saved ? "Remove from wishlist" : "Save to wishlist";

  if (variant === "text") {
    return (
      <button type="button" onClick={toggle} className={cn("text-xs font-medium text-muted-foreground hover:text-red-600 hover:underline", className)}>
        Remove
      </button>
    );
  }
  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
          saved ? "border-rose-200 bg-rose-50 text-rose-600" : "border-border bg-white text-foreground hover:bg-muted",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save for later"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:scale-110",
        saved ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
        className
      )}
    >
      <Heart className={cn("h-4.5 w-4.5", saved && "fill-current")} />
    </button>
  );
}

