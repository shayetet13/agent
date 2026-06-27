"use client";

import { useState, useEffect } from "react";
import { promptPayQRString } from "@/lib/promptpay";

interface Options {
  promptpay: string | undefined;
  amount?: number;
  enabled?: boolean;
  width?: number;
  margin?: number;
}

export function usePromptPayQR({
  promptpay,
  amount,
  enabled = true,
  width = 280,
  margin = 2,
}: Options): { dataUrl: string; error: boolean } {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    async function generate() {
      setError(false);
      if (!promptpay) { setDataUrl(""); return; }
      const digits = promptpay.replace(/\D/g, "");
      if (digits.length < 10) { setDataUrl(""); return; }
      try {
        const { default: QRCode } = await import("qrcode");
        const url = await QRCode.toDataURL(
          promptPayQRString(digits, amount && amount > 0 ? amount : undefined),
          { width, margin, color: { dark: "#000000", light: "#ffffff" }, errorCorrectionLevel: "M" },
        );
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [promptpay, amount, enabled, width, margin]);

  return { dataUrl, error };
}
