import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_W = 1547;
const LOGO_H = 756;

/** GreenGene Pharma brand logo (official transparent PNG in /public/logo.png). */
export function Logo({
  className,
  height = 44,
  priority = false,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="GreenGene Pharma — home"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src="/logo.png"
        alt="GreenGene Pharma"
        width={LOGO_W}
        height={LOGO_H}
        priority={priority}
        sizes="200px"
        className="w-auto"
        style={{ height }}
      />
    </Link>
  );
}
