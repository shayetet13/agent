"use client";

import { useState } from "react";
import { formatNumber, formatDecimal } from "@/lib/format";
import { Field, inputClass } from "./ui";

type PhaseCount = 1 | 2 | 3 | 4;

const PHASE_CONFIGS: Record<PhaseCount, number[]> = {
  1: [100],
  2: [50, 50],
  3: [40, 30, 30],
  4: [40, 30, 20, 10],
};

interface Props {
  dealAmount: number;
  commissionPct: number;
  onCalculate: (phases: Array<{ index: number; amount: number; commission: number }>) => void;
}


export function PaymentPhaseForm({ dealAmount, commissionPct, onCalculate }: Props) {
  const [phaseCount, setPhaseCount] = useState<PhaseCount>(1);
  const [totalAmount, setTotalAmount] = useState(String(dealAmount));

  const parsed = parseFloat(totalAmount) || 0;
  const percentages = PHASE_CONFIGS[phaseCount];

  // Calculate total commission from full deal amount (only for phase 1)
  const totalCommission = Math.round((parsed * commissionPct) / 100 * 100) / 100;

  const phases = percentages.map((pct, idx) => {
    const phaseAmount = Math.round((parsed * pct) / 100 * 100) / 100;
    // Commission only on phase 1, calculated from full deal amount
    const commission = idx === 0 ? totalCommission : 0;
    return { index: idx + 1, amount: phaseAmount, commission };
  });

  const handleCalculate = () => {
    onCalculate(phases);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-4">วางแผนการรับเงิน</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="จำนวนเงินทั้งสิ้น (บาท)">
            <input
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>

          <Field label="แบ่งเป็นกี่งวด">
            <select
              value={phaseCount}
              onChange={(e) => setPhaseCount(Number(e.target.value) as PhaseCount)}
              className={inputClass}
            >
              <option value="1">1 งวด (จ่ายทั้งหมด)</option>
              <option value="2">2 งวด (50/50)</option>
              <option value="3">3 งวด (40/30/30)</option>
              <option value="4">4 งวด (40/30/20/10)</option>
            </select>
          </Field>
        </div>

        {/* Phase breakdown */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">รายละเอียดแต่ละงวด</p>

          {phases.map((phase) => (
            <div
              key={phase.index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                phase.index === 1
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 font-semibold text-sm text-slate-700">
                {phase.index}
              </div>

              <div className="flex-1 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-600">
                    งวดที่ {phase.index}: {percentages[phase.index - 1]}%
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    ฿{formatNumber(phase.amount)}
                  </p>
                </div>

                {phase.commission > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-indigo-600 font-medium">ค่าคอม {commissionPct}%</p>
                    <p className="text-sm font-bold text-indigo-700">
                      +฿{formatDecimal(phase.commission)}
                    </p>
                  </div>
                )}

                {phase.commission === 0 && phase.index > 1 && (
                  <div className="text-right text-xs text-slate-500">
                    ไม่มีค่าคอม
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">รับทั้งสิ้น</span>
            <span className="font-semibold text-slate-900">฿{formatNumber(parsed)}</span>
          </div>
          {commissionPct > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-600">ค่าคอมทั้งสิ้น (งวดแรกเท่านั้น)</span>
                <span className="font-semibold text-indigo-700">
                  +฿{formatDecimal(phases[0]?.commission || 0)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                <span className="text-slate-600">บริษัทได้สุทธิ</span>
                <span className="font-bold text-green-700">
                  ฿{formatNumber(parsed - (phases[0]?.commission || 0))}
                </span>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          className="w-full mt-4 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          ถัดไป: บันทึกการรับเงิน →
        </button>
      </div>

      {commissionPct > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>💡 หมายเหตุ:</strong> ค่าคอมนายหน้า ({commissionPct}%) คำนวนจากงวดแรกเท่านั้น งวดที่ 2, 3, 4 จะไม่มีค่าคอม
          </p>
        </div>
      )}
    </div>
  );
}
