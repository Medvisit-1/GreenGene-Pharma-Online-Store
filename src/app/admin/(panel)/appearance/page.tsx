import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { resolveTheme } from "@/lib/themes";
import { saveAppearance } from "@/app/admin/actions";
import { ThemePicker } from "@/components/admin/theme-picker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Appearance" };

export default async function AppearancePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const s = await getSettings();
  const theme = resolveTheme(s.themePreset, s.themeCustom);
  const custom = resolveTheme("custom", s.themeCustom || JSON.stringify(theme.colors)).colors;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Appearance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose your shop&apos;s colour theme and see it before you apply it.</p>
        </div>
        <Link href="/" target="_blank" className="gg-quick"><ExternalLink className="h-4 w-4" /> View shop</Link>
      </div>
      {saved && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Theme applied — your shop now uses these colours.
        </p>
      )}
      <form action={saveAppearance}>
        <ThemePicker current={theme.id} custom={custom} />
      </form>
    </div>
  );
}
