"use client";

import { useState } from "react";
import { useActionState } from "react";
import { addPayment } from "@/actions/deals";
import { emptyFormState, type FormState } from "@/lib/form";
import { todayISO, formatNumber } from "@/lib/format";
import { SubmitButton, Field, ErrorBanner, inputClass } from "./ui";
import { usePromptPayQR } from "@/hooks/usePromptPayQR";

interface CommissionConfig {
  pct: number;           // commission percent (e.g. 10)
  agentPromptpay?: string;
  agentName?: string;
}

export function PaymentForm({ dealId, commission }: { dealId: string; commission?: CommissionConfig }) {
  const [state, action] = useActionState<FormState, FormData>(addPayment, emptyFormState);
  const [amount, setAmount] = useState("");
  const [isFirst, setIsFirst] = useState(false);

  const parsed = parseFloat(amount) || 0;
  const brokerAmount = commission && parsed > 0
    ? Math.round((parsed * commission.pct) / 100 * 100) / 100
    : 0;
  const netAmount = parsed - brokerAmount;

  const { dataUrl: qrDataUrl } = usePromptPayQR({
    promptpay: commission?.agentPromptpay,
    amount: brokerAmount > 0 ? brokerAmount : undefined,
    width: 280,
  });

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="dealId" value={dealId} />
      <ErrorBanner message={state.error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="จำนวนเงินที่รับ (บาท)" required>
          <input
            className={inputClass}
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="วันที่รับเงิน" required>
          <input className={inputClass} type="date" name="paidAt" defaultValue={todayISO()} required />
        </Field>
      </div>

      {/* Live breakdown */}
      {commission && parsed > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 flex items-start gap-3">
          {qrDataUrl && (
            <div className="bg-white border border-border rounded-xl p-1.5 shadow-sm shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image does not support data: scheme */}
              <img src={qrDataUrl} alt="PromptPay QR ค่าคอม" className="w-24 h-24" />
            </div>
          )}
          <div className="flex flex-col gap-1.5 text-sm flex-1">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">แบ่งรายการนี้</p>
            <div className="flex justify-between">
              <span className="text-muted">รับจากลูกค้า</span>
              <span className="font-semibold">{formatNumber(parsed)} บาท</span>
            </div>
            <div className="flex justify-between text-indigo-700">
              <span>นายหน้า {commission.pct}%{commission.agentName ? ` (${commission.agentName})` : ""}</span>
              <span className="font-bold">{formatNumber(brokerAmount)} บาท</span>
            </div>
            <div className="border-t border-indigo-200 pt-1 flex justify-between">
              <span className="text-muted">บริษัทได้สุทธิ</span>
              <span className="font-bold text-green-700">{formatNumber(netAmount)} บาท</span>
            </div>
            {!commission.agentPromptpay && (
              <p className="text-xs text-amber-600">นายหน้ายังไม่มีเบอร์ PromptPay</p>
            )}
          </div>
        </div>
      )}

      <Field label="">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="isFirstPayment"
            value="true"
            className="w-4 h-4 accent-accent"
            checked={isFirst}
            onChange={(e) => setIsFirst(e.target.checked)}
          />
          <span className="text-sm font-medium text-foreground">เปลี่ยนสถานะดีลเป็น &ldquo;รับงวดแรก&rdquo;</span>
        </label>
      </Field>

      <Field label="หมายเหตุ">
        <input className={inputClass} name="note" placeholder="บันทึกเพิ่มเติม" />
      </Field>

      <div className="pt-1">
        <SubmitButton label="บันทึกการรับเงิน" />
      </div>
    </form>
  );
}
