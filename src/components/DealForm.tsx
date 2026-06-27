"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveDeal } from "@/actions/deals";
import { emptyFormState, type FormState } from "@/lib/form";
import type { Agent, Customer, Deal } from "@/lib/types";
import { PROJECT_TYPE_LABELS, DEAL_STATUS_LABELS, DEAL_STATUS_ORDER } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { SubmitButton, Field, ErrorBanner, inputClass } from "./ui";

export function DealForm({
  deal,
  customers,
  agents,
  defaultCustomerId,
}: {
  deal?: Deal;
  customers: Customer[];
  agents: Agent[];
  defaultCustomerId?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveDeal, emptyFormState);
  const [quotedAmount, setQuotedAmount] = useState(deal?.quotedAmount ?? 0);
  const [commissionPct, setCommissionPct] = useState(deal?.commissionValue ?? 10);

  const brokerAmount = Math.round((quotedAmount * commissionPct) / 100 * 100) / 100;
  const netAmount = quotedAmount - brokerAmount;

  return (
    <form action={action} className="flex flex-col gap-4">
      {deal && <input type="hidden" name="id" value={deal.id} />}
      {/* Hard-code commission type/basis — always percent of each payment */}
      <input type="hidden" name="commissionType" value="percent" />
      <input type="hidden" name="commissionBasis" value="first_payment" />
      <ErrorBanner message={state.error} />

      <Field label="ชื่องาน / โปรเจกต์" required>
        <input className={inputClass} name="title" defaultValue={deal?.title} placeholder="ชื่อโปรเจกต์" required />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ลูกค้า" required>
          <select className={inputClass} name="customerId" defaultValue={deal?.customerId ?? defaultCustomerId ?? ""} required>
            <option value="">— เลือกลูกค้า —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="นายหน้า">
          <select className={inputClass} name="agentId" defaultValue={deal?.agentId ?? ""}>
            <option value="">— ไม่มีนายหน้า —</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ประเภทงาน" required>
          <select className={inputClass} name="projectType" defaultValue={deal?.projectType ?? "web"}>
            {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="สถานะ">
          <select className={inputClass} name="status" defaultValue={deal?.status ?? "lead"}>
            {DEAL_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{DEAL_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="วันครบกำหนดรับเงินงวดถัดไป">
        <input
          className={inputClass}
          type="date"
          name="nextPaymentDue"
          defaultValue={deal?.nextPaymentDue ?? ""}
        />
        <p className="text-xs text-muted mt-1">เว้นว่างได้ — ใช้เตือนเมื่อเลยกำหนดรับเงิน (จะถูกล้างอัตโนมัติเมื่อบันทึกการรับเงิน)</p>
      </Field>

      {/* Amount + Commission side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ยอดเสนอราคา (บาท)" required>
          <input
            className={inputClass}
            type="number"
            name="quotedAmount"
            min="0"
            step="0.01"
            value={quotedAmount === 0 ? "" : quotedAmount}
            placeholder="0"
            required
            onChange={(e) => setQuotedAmount(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="ค่าคอมนายหน้า (%)">
          <div className="flex items-center gap-2">
            <input
              className={inputClass}
              type="number"
              name="commissionValue"
              min="0"
              max="100"
              step="0.1"
              value={commissionPct}
              onChange={(e) => setCommissionPct(parseFloat(e.target.value) || 0)}
            />
            <span className="text-sm text-muted shrink-0">%</span>
          </div>
        </Field>
      </div>

      {/* Live breakdown */}
      {quotedAmount > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">แบ่งยอดต่อรายการรับเงิน</p>
          <div className="flex flex-col gap-0.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">ยอดรับ (ตัวอย่าง)</span>
              <span className="font-semibold">{formatNumber(quotedAmount)} บาท</span>
            </div>
            <div className="flex justify-between text-indigo-700">
              <span>นายหน้า {commissionPct}%</span>
              <span className="font-semibold">{formatNumber(brokerAmount)} บาท</span>
            </div>
            <div className="border-t border-indigo-200 mt-1 pt-1 flex justify-between">
              <span className="text-muted">บริษัทได้รับสุทธิ</span>
              <span className="font-bold text-green-700">{formatNumber(netAmount)} บาท</span>
            </div>
          </div>
        </div>
      )}

      <Field label="รายละเอียด">
        <textarea className={inputClass} name="description" defaultValue={deal?.description} rows={3} placeholder="รายละเอียดงาน" />
      </Field>

      <div className="flex gap-3 pt-2">
        <SubmitButton label={deal ? "บันทึกการแก้ไข" : "สร้างดีล"} />
        <a href={deal ? `/deals/${deal.id}` : "/deals"} className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-slate-100 transition-colors">
          ยกเลิก
        </a>
      </div>
    </form>
  );
}
