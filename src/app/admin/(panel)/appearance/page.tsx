import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { THEME_PRESETS, resolveAdminTheme, resolveTheme } from "@/lib/themes";
import { saveAppearance } from "@/app/admin/actions";
import { ThemePicker } from "@/components/admin/theme-picker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Appearance" };

export default async function AppearancePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const s = await getSettings();
  const theme = resolveTheme(s.themePreset, s.themeCustom);
  const adminTheme = resolveAdminTheme(s);
  const nameOf = (id: string) => THEME_PRESETS.find((t) => t.id === id)?.name ?? "Your own colours";
  const savedText = { shop: "Theme applied to your shop.", admin: "Theme applied to the admin.", both: "Theme applied to your shop and the admin." }[saved ?? ""] ?? "Theme applied.";
  const custom = resolveTheme("custom", s.themeCustom || JSON.stringify(theme.colors)).colors;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Appearance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose colour themes for your shop and this admin, and see them before you apply.</p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-3 py-1">Shop: <strong>{nameOf(theme.id)}</strong></span>
            <span className="rounded-full bg-white px-3 py-1">Admin: <strong>{nameOf(adminTheme.id)}</strong>{!s.adminThemePreset && " (same as shop)"}</span>
          </p>
        </div>
        <Link href="/" target="_blank" className="gg-quick"><ExternalLink className="h-4 w-4" /> View shop</Link>
      </div>
      {saved && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {savedText}
        </p>
      )}
      <form action={saveAppearance}>
        <ThemePicker current={theme.id} custom={custom} />
      </form>
    </div>
  );
}
