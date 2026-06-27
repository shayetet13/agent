"use client";

import { useActionState, useRef } from "react";
import { uploadPayoutSlip } from "@/actions/payouts";

interface Props {
  payoutId: string;
  slipUrl?: string | null;
}

export function SlipUpload({ payoutId, slipUrl }: Props) {
  const [state, formAction, pending] = useActionState(uploadPayoutSlip, {});
  const inputRef = useRef<HTMLInputElement>(null);

  const displaySlip = state.url ?? slipUrl;

  function triggerPick() {
    inputRef.current?.click();
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="payoutId" value={payoutId} />
      <input
        ref={inputRef}
        type="file"
        name="slip"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            (e.target.form as HTMLFormElement).requestSubmit();
          }
        }}
      />

      {displaySlip ? (
        <div className="flex items-center gap-2">
          <button type="button" onClick={triggerPick} title="คลิกเพื่อเปลี่ยนสลิป">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySlip}
              alt="สลิปโอนเงิน"
              className="h-9 w-9 object-cover rounded border border-border hover:opacity-80 transition-opacity"
            />
          </button>
          <a
            href={displaySlip}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            ดูสลิป
          </a>
          <button
            type="button"
            onClick={triggerPick}
            disabled={pending}
            className="text-xs text-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            {pending ? "กำลังอัพโหลด…" : "เปลี่ยน"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={triggerPick}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {pending ? "กำลังอัพโหลด…" : "แนบสลิป"}
          </button>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        </div>
      )}
    </form>
  );
}
