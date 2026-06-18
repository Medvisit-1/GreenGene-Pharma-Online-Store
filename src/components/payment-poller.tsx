"use client";

import { useEffect } from "react";

/**
 * Shown on the order page while a gateway payment is being confirmed.
 * Reloads the page periodically so it flips to "paid" once the webhook lands.
 */
export function PaymentPoller({ intervalMs = 5000, maxTries = 36 }: { intervalMs?: number; maxTries?: number }) {
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > maxTries) {
        clearInterval(id);
        return;
      }
      window.location.reload();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, maxTries]);

  return null;
}
