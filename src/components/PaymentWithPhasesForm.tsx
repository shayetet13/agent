"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addPayment } from "@/actions/deals";
import { PaymentPhaseForm } from "./PaymentPhaseForm";
import { emptyFormState, type FormState } from "@/lib/form";
import { Field, inputClass, ErrorBanner } from "./ui";

interface CommissionConfig {
  pct: number;
  agentPromptpay?: string;
  agentName?: string;
}

interface Phase {
  index: number;
  amount: number;
  commission: number;
}

interface Props {
  dealId: string;
  dealAmount: number;
  existingPaymentsCount?: number;
  paidTotal?: number;
  plannedPhases?: number;
  commission?: CommissionConfig;
}

import { formatNumber } from "@/lib/format";

export function PaymentWithPhasesForm({
  dealId,
  dealAmount,
  existingPaymentsCount = 0,
  paidTotal = 0,
  plannedPhases,
  commission,
}: Props) {
  const isFirstPayment = existingPaymentsCount === 0;

  // งวดที่ 2+ → ข้ามขั้นตอน plan ไปเลย เพราะไม่มีค่าคอมแล้ว
  const [step, setStep] = useState<"plan" | "payment">(
    isFirstPayment ? "plan" : "payment"
  );
  const [phases, setPhases] = useState<Phase[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState<FormState, FormData>(addPayment, emptyFormState);
  const router = useRouter();

  useEffect(() => {
    if (submitted && !isPending && !state?.error) {
      Promise.resolve().then(() => {
        if (isFirstPayment) {
          setStep("plan");
          setPhases([]);
        }
        setSubmitted(false);
        router.refresh();
      });
    }
  }, [submitted, isPending, state?.error, router, isFirstPayment]);

  const handleCalculate = (calculatedPhases: Phase[]) => {
    setPhases(calculatedPhases);
    setStep("payment");
  };

  // ===== งวดแรก: Step 1 — วางแผน =====
  if (step === "plan" && isFirstPayment) {
    return (
      <PaymentPhaseForm
        dealAmount={dealAmount}
        commissionPct={commission?.pct ?? 0}
        onCalculate={handleCalculate}
      />
    );
  }

  // ===== งวดแรก: Step 2 — บันทึกพร้อมค่าคอม =====
  if (step === "payment" && isFirstPayment) {
    const firstPhase = phases[0];
    if (!firstPhase) return null;

    const brokerAmount = firstPhase.commission;
    const netAmount = firstPhase.amount - brokerAmount;

    return (
      <div className="flex flex-col gap-4">
        {/* สรุปแผนงวด */}
        {phases.length > 1 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-900 mb-2">
              ✓ วางแผนการรับเงิน {phases.length} งวด
            </p>
            <div className="space-y-1">
              {phases.map((phase) => (
                <div key={phase.index} className="flex justify-between text-xs text-purple-700">
                  <span>งวดที่ {phase.index}</span>
                  <span>฿{formatNumber(phase.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form action={formAction} onSubmit={() => setSubmitted(true)} className="flex flex-col gap-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="amount" value={String(firstPhase.amount)} />
          <input type="hidden" name="isFirstPayment" value="true" />
          <input type="hidden" name="plannedPhases" value={String(phases.length)} />
          <ErrorBanner message={state.error} />

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-800">
            <span className="font-semibold">งวดที่ 1</span>
            {" — "}฿{formatNumber(firstPhase.amount)}
            {brokerAmount > 0 && (
              <span className="ml-2 text-indigo-600">· ค่าคอม ฿{brokerAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            )}
          </div>

          <Field label="วันที่รับเงิน" required>
            <input
              className={inputClass}
              type="date"
              name="paidAt"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </Field>

          {commission && brokerAmount > 0 && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm space-y-1">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">แบ่งรายการนี้</p>
              <div className="flex justify-between">
                <span className="text-muted">รับจากลูกค้า</span>
                <span className="font-semibold">{formatNumber(firstPhase.amount)} บาท</span>
              </div>
              <div className="flex justify-between text-indigo-700">
                <span>นายหน้า {commission.pct}% (คิดจากราคาเต็ม){commission.agentName ? ` · ${commission.agentName}` : ""}</span>
                <span className="font-bold">{brokerAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
              </div>
              <div className="border-t border-indigo-200 pt-1 flex justify-between">
                <span className="text-muted">บริษัทได้สุทธิ</span>
                <span className="font-bold text-green-700">{formatNumber(netAmount)} บาท</span>
              </div>
            </div>
          )}

          <Field label="หมายเหตุ">
            <input className={inputClass} name="note" placeholder={`งวด 1/${phases.length || 1}`} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setStep("plan"); setPhases([]); }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              ← ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "กำลังบันทึก…" : "บันทึกการรับเงิน"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ===== งวดที่ 2+ — ฟอร์มเรียบง่าย ไม่มีค่าคอม =====
  const installmentNo = existingPaymentsCount + 1;
  const remaining = Math.max(0, dealAmount - paidTotal);
  // คำนวณยอดงวดนี้ = remaining ÷ จำนวนงวดที่เหลือ
  const remainingInstallments = plannedPhases
    ? Math.max(1, plannedPhases - existingPaymentsCount)
    : 1;
  const suggestedAmount = remaining > 0
    ? Math.round((remaining / remainingInstallments) * 100) / 100
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 space-y-1">
        <div>
          บันทึกการรับเงิน <span className="font-semibold text-slate-900">งวดที่ {installmentNo}</span>
          <span className="ml-2 text-xs text-slate-500">(ไม่มีค่าคอม — คิดไปแล้วงวดแรก)</span>
        </div>
        {dealAmount > 0 && (
          <div className="flex gap-4 text-xs text-slate-500 pt-0.5">
            <span>รับไปแล้ว <span className="font-medium text-slate-700">฿{formatNumber(paidTotal)}</span></span>
            <span>ยังค้างอยู่ <span className="font-semibold text-amber-700">฿{formatNumber(remaining)}</span></span>
          </div>
        )}
      </div>

      <form action={formAction} onSubmit={() => setSubmitted(true)} className="flex flex-col gap-3">
        <input type="hidden" name="dealId" value={dealId} />
        <input type="hidden" name="isFirstPayment" value="false" />
        <ErrorBanner message={state.error} />

        <Field label="จำนวนเงินที่รับ (บาท)" required>
          <input
            className={inputClass}
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            defaultValue={suggestedAmount > 0 ? suggestedAmount : undefined}
            placeholder="0.00"
            required
          />
        </Field>

        <Field label="วันที่รับเงิน" required>
          <input
            className={inputClass}
            type="date"
            name="paidAt"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
          />
        </Field>

        <Field label="หมายเหตุ">
          <input
            className={inputClass}
            name="note"
            placeholder={`งวดที่ ${installmentNo}`}
          />
        </Field>

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "กำลังบันทึก…" : `บันทึกรับเงินงวดที่ ${installmentNo}`}
        </button>
      </form>
    </div>
  );
}
