"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 30_000; // refresh ทุก 30 วินาที

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    const id = setInterval(tick, INTERVAL_MS);

    // refresh ทันทีเมื่อ user กลับมาที่ tab
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  return null;
}
