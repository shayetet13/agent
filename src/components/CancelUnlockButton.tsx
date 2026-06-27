"use client";

import { useState, useRef, useTransition } from "react";
import { updateDealStatus } from "@/actions/deals";
import type { DealStatus } from "@/lib/types";

interface Props {
  id: string;
  status: DealStatus;
  label: string;
}

export function CancelUnlockButton({ id, status, label }: Props) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setPin("");
    setError("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeModal() {
    setOpen(false);
    setPin("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) { setError("กรุณาใส่รหัส"); return; }
    setError("");

    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    fd.set("pin", pin.trim());

    startTransition(async () => {
      const result = await updateDealStatus(fd);
      if (result?.error) {
        setError(result.error);
        setPin("");
        inputRef.current?.focus();
      } else {
        closeModal();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-xs px-3 py-1.5 rounded-full border transition-colors border-slate-300 text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
      >
        🔒 {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl shrink-0">
                  🔒
                </div>
                <div>
                  <p className="font-semibold text-slate-800">ยืนยันตัวตน Admin</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เปลี่ยนสถานะเป็น <span className="font-medium text-slate-700">"{label}"</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  รหัส Admin
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(""); }}
                  placeholder="ใส่รหัส..."
                  autoComplete="off"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors tracking-widest"
                  style={{ borderColor: error ? "#fca5a5" : undefined }}
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1.5">{error}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                >
                  {pending ? "กำลังตรวจสอบ…" : "ยืนยัน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
