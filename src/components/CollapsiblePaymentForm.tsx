"use client";

import { useState } from "react";
import { PaymentWithPhasesForm } from "./PaymentWithPhasesForm";

interface CommissionConfig {
  pct: number;
  agentPromptpay?: string;
  agentName?: string;
}

interface Props {
  dealId: string;
  dealAmount?: number;
  existingPaymentsCount?: number;
  paidTotal?: number;
  plannedPhases?: number;
  commission?: CommissionConfig;
}

export function CollapsiblePaymentForm({
  dealId,
  dealAmount = 0,
  existingPaymentsCount = 0,
  paidTotal = 0,
  plannedPhases,
  commission,
}: Props) {
  const [open, setOpen] = useState(false);

  // ครบทุกงวดที่วางแผนไว้ — ไม่ต้องบันทึกเพิ่มแล้ว
  const allPhasesDone = plannedPhases !== undefined && existingPaymentsCount >= plannedPhases;

  if (allPhasesDone) {
    return (
      <div className="px-4 py-3 border-t border-green-200 bg-green-50 flex items-center gap-2">
        <span className="text-green-700 text-sm font-medium">
          ✓ รับเงินครบ {plannedPhases} งวดแล้ว
        </span>
      </div>
    );
  }

  const label = existingPaymentsCount === 0
    ? "+ บันทึกรับเงิน (งวดแรก)"
    : `+ บันทึกรับเงิน (งวดที่ ${existingPaymentsCount + 1}${plannedPhases ? `/${plannedPhases}` : ""})`;

  if (!open) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-accent hover:underline font-medium"
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted">
          บันทึกการรับเงิน
          {existingPaymentsCount > 0 && (
            <span className="ml-2 text-xs text-indigo-600 font-semibold">
              งวดที่ {existingPaymentsCount + 1}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ✕ ปิด
        </button>
      </div>
      <PaymentWithPhasesForm
        dealId={dealId}
        dealAmount={dealAmount}
        existingPaymentsCount={existingPaymentsCount}
        paidTotal={paidTotal}
        plannedPhases={plannedPhases}
        commission={commission}
      />
    </div>
  );
}
