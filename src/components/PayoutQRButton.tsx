"use client";

import { useState, useEffect } from "react";
import { formatBaht } from "@/lib/format";
import { usePromptPayQR } from "@/hooks/usePromptPayQR";

interface Props {
  promptpay: string;
  amount: number;
  agentName?: string;
}

export function PayoutQRButton({ promptpay, amount, agentName }: Props) {
  const [show, setShow] = useState(false);
  const { dataUrl } = usePromptPayQR({ promptpay, amount, enabled: show, width: 480, margin: 3 });

  // ปิดด้วย Escape
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShow(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors font-medium"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 3h6v6H3zM3 15h6v6H3zM15 3h6v6h-6zM15 12h3v3h-3zM18 18h3v3h-3zM12 12h3v3h-3zM12 18v3M15 18h3"
          />
        </svg>
        สแกนจ่าย
      </button>

      {/* Fixed modal — ไม่ถูกตัดโดย overflow-hidden ของ table */}
      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShow(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-3 w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
              aria-label="ปิด"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <p className="text-xs font-semibold text-muted uppercase tracking-wide pt-1">
              PromptPay {agentName ? `— ${agentName}` : ""}
            </p>

            {dataUrl ? (
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image does not support data: scheme */}
                <img src={dataUrl} alt="PromptPay QR" className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-100 rounded-2xl animate-pulse" />
            )}

            <p className="text-xl font-bold text-indigo-600">{formatBaht(amount)}</p>
            <p className="text-xs text-muted">{promptpay}</p>
            <p className="text-xs text-muted/60">กดนอกกรอบหรือ Esc เพื่อปิด</p>
          </div>
        </div>
      )}
    </>
  );
}
