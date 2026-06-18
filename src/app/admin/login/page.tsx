import Image from "next/image";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin Login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-header px-4">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Image src="/logo.png" alt="GreenGene Pharma" width={1547} height={756} className="h-12 w-auto" />
        </div>
        <h1 className="text-center text-xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Manage your store
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
