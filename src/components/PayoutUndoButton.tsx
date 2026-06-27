"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { markPayoutPendingWithPin, type PinState } from "@/actions/payouts";

const emptyState: PinState = {};

export function PayoutUndoButton({ payoutId }: { payoutId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PinState, FormData>(
    markPayoutPendingWithPin,
    emptyState,
  );
  const pinRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => pinRef.current?.focus(), 50);
  }, [open]);

  // Detect success → close modal + refresh in-place
  useEffect(() => {
    if (submitted && !pending && !state?.error) {
      Promise.resolve().then(() => {
        setOpen(false);
        setSubmitted(false);
        router.refresh();
      });
    }
  }, [submitted, pending, state?.error, router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded border border-border text-muted hover:bg-slate-50 transition-colors"
      >
        ยกเลิก
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors text-lg leading-none"
              aria-label="ปิด"
            >
              ✕
            </button>

            <div className="flex flex-col gap-1.5">
              <h3 className="font-semibold text-foreground">ยืนยันการยกเลิก</h3>
              <p className="text-sm text-muted">
                เปลี่ยนสถานะกลับเป็น &ldquo;ค้างจ่าย&rdquo;?<br />
                กรอกรหัสผ่าน Admin เพื่อยืนยัน
              </p>
            </div>

            <form action={action} onSubmit={() => setSubmitted(true)} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={payoutId} />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">รหัสผ่าน</label>
                <input
                  ref={pinRef}
                  type="password"
                  name="pin"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-9 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 transition-all"
                />
              </div>

              {state.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {state.error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 h-9 rounded-md bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {pending ? "กำลังยืนยัน…" : "ยืนยัน"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-9 rounded-md border border-border text-sm hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
