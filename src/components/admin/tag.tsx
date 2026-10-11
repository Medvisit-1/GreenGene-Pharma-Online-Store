import { cn } from "@/lib/utils";

/** Small status pill used in admin tables. */
export function Tag({ tone, children }: { tone: "green" | "plum" | "gray" | "red" | "amber"; children: React.ReactNode }) {
  const tones = {
    green: "bg-brand-100 text-brand-700",
    plum: "bg-plum-100 text-plum-700",
    gray: "bg-muted text-muted-foreground",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}
