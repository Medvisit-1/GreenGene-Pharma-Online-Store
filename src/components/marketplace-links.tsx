import { ExternalLink } from "lucide-react";

/** Normalise a stored link into a safe absolute URL (or null). */
function normalize(url?: string | null): string | null {
  const t = (url ?? "").trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

const MARKETS = [
  {
    key: "takealot",
    label: "takealot",
    // brand-coloured button (wordmark, not the trademarked logo artwork)
    className: "bg-[#0e8fd1] hover:bg-[#0b7ab3] text-white",
    accent: null as string | null,
  },
  {
    key: "amazon",
    label: "amazon",
    className: "bg-[#232f3e] hover:bg-[#131a22] text-white",
    accent: "#ff9900",
  },
  {
    key: "bobshop",
    label: "bobshop",
    className: "bg-[#10a99b] hover:bg-[#0d9084] text-white",
    accent: null,
  },
] as const;

export function MarketplaceLinks({
  takealotUrl,
  amazonUrl,
  bobshopUrl,
}: {
  takealotUrl?: string | null;
  amazonUrl?: string | null;
  bobshopUrl?: string | null;
}) {
  const urls: Record<string, string | null> = {
    takealot: normalize(takealotUrl),
    amazon: normalize(amazonUrl),
    bobshop: normalize(bobshopUrl),
  };
  const available = MARKETS.filter((m) => urls[m.key]);
  if (!available.length) return null;

  return (
    <section className="mt-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-6 text-center sm:p-8">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Also available at
        </h3>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {available.map((m) => (
            <a
              key={m.key}
              href={urls[m.key]!}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`View this product on ${m.label}`}
              className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-extrabold lowercase tracking-tight shadow-sm transition-colors ${m.className}`}
            >
              <span className="flex flex-col items-center leading-none">
                <span>{m.label}</span>
                {m.accent && (
                  <span
                    className="mt-1 h-1 w-8 rounded-full"
                    style={{ backgroundColor: m.accent }}
                  />
                )}
              </span>
              <ExternalLink className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
