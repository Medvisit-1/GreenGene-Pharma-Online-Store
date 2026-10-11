/**
 * Runs once when the server starts. Starts the background scheduler that sends
 * the wellness newsletter, refill / saved-cart reminders and back-in-stock alerts.
 * Set DISABLE_SCHEDULER=1 to turn it off (e.g. if an external cron calls /api/cron/run).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_SCHEDULER === "1" || process.env.NEXT_PHASE === "phase-production-build") return;

  const g = globalThis as typeof globalThis & { __ggScheduler?: boolean };
  if (g.__ggScheduler) return;
  g.__ggScheduler = true;

  const everyMs = Math.max(1, Number(process.env.SCHEDULER_INTERVAL_MINUTES) || 10) * 60_000;
  const tick = async () => {
    try {
      const { runScheduledJobs } = await import("@/lib/scheduler");
      const report = await runScheduledJobs();
      if (process.env.SCHEDULER_DEBUG === "1" || Object.values(report).some((r) => /sent "|[1-9]\d* sent|error/.test(r))) {
        console.log("[scheduler]", JSON.stringify(report));
      }
    } catch (e) {
      console.error("[scheduler] run failed:", e);
    }
  };
  // First run shortly after start-up (so the server is ready), then on an interval
  setTimeout(tick, 60_000).unref?.();
  setInterval(tick, everyMs).unref?.();
  console.log(`[scheduler] started — runs every ${everyMs / 60_000} min`);
}
