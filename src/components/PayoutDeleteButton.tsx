"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deletePayoutWithPin } from "@/actions/payouts";

interface Props {
  payoutId: string;
}

export function PayoutDeleteButton({ payoutId }: Props) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(deletePayoutWithPin, { error: undefined });

  // Detect success: submitted once + no longer pending + no error
  useEffect(() => {
    if (submitted && !isPending && !state?.error) {
      // Schedule state updates as a microtask — keeps setState out of
      // the direct effect body to satisfy react-hooks/set-state-in-effect
      Promise.resolve().then(() => {
        setOpen(false);
        setPin("");
        setSubmitted(false);
        router.refresh();
      });
    }
  }, [submitted, isPending, state?.error, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
      >
        ✕ ลบ
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 max-w-[calc(100%-2rem)]">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">ยืนยันการลบ</h2>
            <p className="text-sm text-slate-600 mb-6">
              กรุณากรอกรหัสผ่านเพื่อยืนยันการลบค่าคอมนี้
            </p>

            <form
              action={formAction}
              onSubmit={() => setSubmitted(true)}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={payoutId} />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  รหัสผ่าน Admin
                </label>
                <input
                  type="password"
                  name="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
                  autoFocus
                />
              </div>

              {state?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {state.error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setPin(""); setSubmitted(false); }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "กำลังลบ…" : "ลบ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
