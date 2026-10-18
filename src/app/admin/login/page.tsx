import Image from "next/image";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { GardenDefs, Petals, Sprig } from "@/components/garden/art";
import { gardenFonts } from "@/components/garden/fonts";
import "../admin.css";

export const metadata = { title: "Admin Login" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      className={`gg-admin ${gardenFonts} relative flex min-h-screen items-center justify-center overflow-hidden px-4`}
      style={{ background: "radial-gradient(120% 90% at 80% 0%, #8b3463 0%, #5c1a3b 50%, #3f1029 100%)" }}
    >
      <GardenDefs />
      <Petals colors={["#a64274", "#c97a9e", "#e3b6c8"]} leaf="#3b8a5b" count={16} height={900} />
      <Sprig kind="green" style={{ left: -30, bottom: -40, width: 220, transform: "rotate(10deg)", opacity: 0.7 }} />
      <Sprig kind="plum" style={{ right: -20, top: -30, width: 200, transform: "rotate(190deg)", opacity: 0.8 }} />

      <div className="relative z-10 w-full max-w-sm rounded-[28px] bg-[#fbf7f1] p-8 shadow-2xl">
        <div className="mb-5 flex justify-center">
          <Image src="/logo.png" alt="GreenGene Pharma" width={1547} height={756} className="h-12 w-auto" priority />
        </div>
        <h1 className="text-center font-[family-name:var(--font-g-serif)] text-3xl font-semibold text-[#5c1a3b]">Welcome back</h1>
        <p className="text-center font-[family-name:var(--font-g-script)] text-xl text-[#2f6b47]">let&apos;s grow your shop</p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
          </div>
          <Button type="submit" size="lg" className="w-full">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
