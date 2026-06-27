"use client";

import { useState, useTransition } from "react";
import { createQuotation } from "@/actions/quotations";
import type { QuotationItem, Agent } from "@/lib/types";
import { formatDecimal } from "@/lib/format";

interface Props {
  customerId: string;
  customerName: string;
  agents: Agent[];
}

const EMPTY_ITEM: QuotationItem = { description: "", qty: 1, unitPrice: 0 };

export function QuotationForm({ customerId, customerName, agents }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([{ ...EMPTY_ITEM }]);
  const [taxPercent, setTaxPercent] = useState(7);

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof QuotationItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, [field]: field === "description" ? value : Number(value) } : item
      )
    );
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const tax = subtotal * (taxPercent / 100);
  const total = subtotal + tax;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("items", JSON.stringify(items));
    fd.set("customerId", customerId);
    startTransition(async () => {
      const res = await createQuotation(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ข้อมูลหลัก */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-800">ข้อมูลใบเสนอราคา</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">ลูกค้า</label>
          <div className="px-3 py-2.5 rounded-lg border border-border bg-slate-50 text-sm text-slate-600">
            {customerName}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              นายหน้า / ตัวแทน <span className="text-muted font-normal">(ถ้ามี)</span>
            </label>
            <select
              name="agentId"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors bg-white"
            >
              <option value="">— ไม่มีนายหน้า (ลูกค้าติดต่อตรง) —</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.phone})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ชื่อโปรเจค / หัวข้อ <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="เช่น: พัฒนาเว็บไซต์บริษัท"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ภาษีมูลค่าเพิ่ม</label>
            <select
              name="taxPercent"
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors bg-white"
            >
              <option value={0}>ไม่มี VAT</option>
              <option value={7}>VAT 7%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">อายุใบเสนอราคา (วัน)</label>
            <input
              name="validDays"
              type="number"
              min={1}
              defaultValue={30}
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            />
          </div>
        </div>
      </div>

      {/* รายการ */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">รายการสินค้า / บริการ</h2>
          <button
            type="button"
            onClick={addItem}
            className="text-sm px-3 py-1.5 rounded-lg border border-accent text-accent hover:bg-accent/5 transition-colors font-medium"
          >
            + เพิ่มรายการ
          </button>
        </div>

        {/* header */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_130px_36px] gap-2 text-xs font-medium text-muted uppercase tracking-wide px-1">
          <span>รายละเอียด</span>
          <span className="text-center">จำนวน</span>
          <span className="text-right">ราคาต่อหน่วย</span>
          <span />
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_130px_36px] gap-2 items-start">
              <textarea
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder={`รายการที่ ${i + 1} (กด Enter เพื่อขึ้นบรรทัดใหม่)\n- พิมพ์ - นำหน้าเพื่อเป็นหัวข้อย่อย\n## พิมพ์ ## นำหน้าเพื่อเป็นหัวข้อหลัก`}
                required
                rows={2}
                className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-y"
              />
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => updateItem(i, "qty", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="px-3 py-2 rounded-lg border border-border text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
              <input
                type="number"
                min={0}
                step={1}
                value={item.unitPrice === 0 ? "" : item.unitPrice}
                onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0"
                className="px-3 py-2 rounded-lg border border-border text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length === 1}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* รวม */}
        <div className="border-t border-border pt-4 flex flex-col gap-1.5 items-end text-sm">
          <div className="flex gap-8 text-muted">
            <span>ราคาก่อน VAT</span>
            <span className="w-36 text-right font-medium text-foreground">฿{formatDecimal(subtotal)}</span>
          </div>
          {taxPercent > 0 && (
            <div className="flex gap-8 text-muted">
              <span>VAT {taxPercent}%</span>
              <span className="w-36 text-right font-medium text-foreground">฿{formatDecimal(tax)}</span>
            </div>
          )}
          <div className="flex gap-8 font-bold text-base border-t border-border pt-2 mt-1">
            <span>รวมทั้งสิ้น</span>
            <span className="w-36 text-right text-accent">฿{formatDecimal(total)}</span>
          </div>
        </div>
      </div>

      {/* หมายเหตุ */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-slate-800">หมายเหตุ / เงื่อนไข</h2>

        {/* Checkbox: ไม่รวม domain+hosting */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            name="excludeHosting"
            className="mt-0.5 w-4 h-4 rounded border-border accent-accent cursor-pointer"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-accent transition-colors">
              ราคานี้ไม่รวมค่าจดทะเบียนโดเมนและ Hosting
            </span>
            <p className="text-xs text-muted mt-0.5">จะแสดงเป็นข้อความเตือนในใบเสนอราคา</p>
          </div>
        </label>

        <textarea
          name="notes"
          rows={3}
          placeholder="หมายเหตุเพิ่มเติม เช่น: ชำระ 50% ก่อนเริ่มงาน..."
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => history.back()}
          className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← ยกเลิก
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? "กำลังสร้าง…" : "สร้างใบเสนอราคา →"}
        </button>
      </div>
    </form>
  );
}
