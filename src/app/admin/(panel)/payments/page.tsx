import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { getGatewayStatuses } from "@/lib/payments";
import { saveGateways } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment Gateways" };

export default async function AdminPayments({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const gateways = await getGatewayStatuses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment gateways</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which gateways customers can pay with at checkout. A gateway only
          appears to customers when it is <strong>active</strong> and its API keys are configured.
        </p>
      </div>

      {saved && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> Payment gateways saved.
        </p>
      )}

      <form action={saveGateways} className="max-w-2xl space-y-4">
        {gateways.map((g) => {
          const showsAtCheckout = g.active && g.implemented && g.configured;
          return (
            <div
              key={g.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{g.label}</h2>
                  {!g.implemented ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                      <Clock className="h-3 w-3" /> Coming soon
                    </span>
                  ) : g.configured ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Needs API keys
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                {g.implemented && !g.configured && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Add <code className="rounded bg-amber-50 px-1">{g.envHint}</code> in the
                    server environment to enable this gateway.
                  </p>
                )}
                {!g.implemented && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    Integration not available yet — this option can’t be activated.
                  </p>
                )}
                {g.active && g.implemented && (
                  <p className="mt-2 text-xs font-medium">
                    {showsAtCheckout ? (
                      <span className="text-brand-700">● Shown to customers at checkout</span>
                    ) : (
                      <span className="text-amber-700">
                        ● Active, but hidden until API keys are added
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Toggle */}
              <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  name={`gateway_${g.id}`}
                  defaultChecked={g.active}
                  disabled={!g.implemented}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-40" />
              </label>
            </div>
          );
        })}

        <Button type="submit" size="lg">Save changes</Button>
      </form>
    </div>
  );
}
