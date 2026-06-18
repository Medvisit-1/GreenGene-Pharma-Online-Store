"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Fires a success toast after an admin save redirect (?saved=1), then strips the param. */
export function AdminToast() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("saved")) {
      toast.success("Saved successfully");
      router.replace(window.location.pathname);
    }
  }, [params, router]);

  return null;
}
