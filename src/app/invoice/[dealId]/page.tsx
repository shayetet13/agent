import { notFound, redirect } from "next/navigation";
import { Sarabun } from "next/font/google";
import QRCode from "qrcode";
import { getData, update } from "@/lib/db";
import { getSession } from "@/lib/session";
import { nextDocNumber } from "@/lib/doc-numbers";
import { formatBaht, formatDateLong } from "@/lib/format";
import { bahtText } from "@/lib/bahttext";
import { PROJECT_TYPE_LABELS } from "@/lib/types";
import { COMPANY as ISSUER, DOC_INK as INK, DOC_GRADIENT as BRAND_GRADIENT, DOC_LABEL_CLS as labelCls } from "@/lib/constants";
import { promptPayQRString } from "@/lib/promptpay";
import { ReceiptActions } from "@/components/ReceiptActions";
import { ReceiptFrame } from "@/components/ReceiptFrame";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

// ใบแจ้งหนี้เป็นหน้าเดียว — ถ้า description รวมยาวเกินพื้นที่ ~1 หน้า ให้ย่อเหลือหัวข้อหลัก
const INVOICE_LINE_BUDGET = 11;

function descWeight(desc: string): number {
  let w = 0;
  for (const l of desc.split("\n")) {
    const t = l.trim();
    if (!t) { w += 0.3; continue; }
    w += Math.max(1, Math.ceil(t.replace(/^[-•#\s]+/, "").length / 60));
  }
  return w;
}

/** ดึงเฉพาะหัวข้อหลัก (## ...) — ถ้าไม่มี ใช้บรรทัดแรกที่ไม่ว่าง */
function mainHeadings(desc: string): string[] {
  const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean);
  const heads = lines.filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
  if (heads.length > 0) return heads;
  return lines.length > 0 ? [lines[0].replace(/^[-•]\s*/, "")] : [];
}

export default async function InvoicePage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const [data, session] = await Promise.all([getData(), getSession()]);

  if (session?.type !== "admin") redirect("/login");

  const deal = data.deals.find((d) => d.id === dealId);
  if (!deal) notFound();

  const customer = data.customers.find((c) => c.id === deal.customerId);
  const quotation = data.quotations.find((q) => q.dealId === dealId);
  const totalPaid = data.payments
    .filter((p) => p.dealId === dealId)
    .reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, deal.quotedAmount - totalPaid);

  const invoiceAmount = totalPaid > 0 ? remaining : deal.quotedAmount;
  const ppQrDataUrl = await QRCode.toDataURL(
    promptPayQRString("0835519787", invoiceAmount),
    { width: 120, margin: 1 }
  ).catch(() => "");

  // เลขที่ใบแจ้งหนี้: ใช้ค่าที่เก็บไว้ หรือสร้างใหม่ครั้งแรก
  let no = deal.invoiceNumber ?? "";
  if (!no) {
    no = nextDocNumber(data.deals.map((d) => d.invoiceNumber), "INV");
    await update("deals", dealId, { invoiceNumber: no });
  }

  // ย่อรายละเอียดเหลือหัวข้อหลัก เฉพาะเมื่อ description รวมยาวเกิน ~1 หน้า
  const condensed = quotation
    ? quotation.items.reduce((s, it) => s + descWeight(it.description), 0) > INVOICE_LINE_BUDGET
    : false;
  const itemHeadings = condensed && quotation
    ? quotation.items.map((it) => mainHeadings(it.description))
    : null;

  // Due date: 7 days from today
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return (
    <div
      className="receipt-screen min-h-screen bg-zinc-200/70 py-6 overflow-x-hidden print:bg-white print:py-0"
      style={{ fontFamily: `${sarabun.style.fontFamily}, system-ui, sans-serif`, color: INK }}
    >
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .print\\:hidden { display: none !important; }
          .receipt-frame { zoom: 1 !important; width: auto !important; }
          .sheet { width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <ReceiptFrame>
        <div
          className="sheet relative bg-white shadow-[0_10px_40px_-12px_rgba(0,0,0,0.3)]"
          style={{ width: "794px", minHeight: "1123px" }}
        >
          {/* แถบสีแบรนด์ด้านบน */}
          <div style={{ height: "6px", background: BRAND_GRADIENT }} />

          <div className="px-12 pt-9 pb-10">
            {/* Letterhead */}
            <header className="flex items-start justify-between gap-8">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-stacka7.png" alt="STACKA7" className="w-[72px] h-[72px] object-contain" />
                <div className="pt-1">
                  <h1 className="text-[28px] font-bold leading-none tracking-tight" style={{ color: INK }}>{ISSUER.name}</h1>
                  <p className="text-[14px] text-zinc-500 mt-2 max-w-[320px] leading-snug">{ISSUER.tagline}</p>
                </div>
              </div>
              <div className="text-right pt-1">
                <h2 className="text-[24px] font-bold leading-none tracking-tight" style={{ color: INK }}>ใบแจ้งหนี้</h2>
                <p className="text-[13px] font-medium tracking-[0.3em] text-zinc-400 mt-1.5">INVOICE</p>
              </div>
            </header>

            <div className="mt-5 h-px w-full" style={{ background: BRAND_GRADIENT }} />

            {/* Meta strip */}
            <div className="mt-5 grid grid-cols-3 border border-zinc-200">
              <div className="px-4 py-3 border-r border-zinc-200">
                <p className={labelCls}>เลขที่เอกสาร</p>
                <p className="text-[15px] font-semibold mt-1 tabular-nums" style={{ color: INK }}>{no}</p>
              </div>
              <div className="px-4 py-3 border-r border-zinc-200">
                <p className={labelCls}>วันที่ออกเอกสาร</p>
                <p className="text-[15px] font-semibold mt-1" style={{ color: INK }}>{formatDateLong(new Date().toISOString())}</p>
              </div>
              <div className="px-4 py-3">
                <p className={labelCls}>กำหนดชำระ</p>
                <p className="text-[15px] font-semibold mt-1 text-red-600">{formatDateLong(dueDate.toISOString())}</p>
              </div>
            </div>

            {/* Parties */}
            <section className="mt-6 grid grid-cols-2 gap-10 relative z-10">
              <div>
                <p className={labelCls}>เรียนเก็บเงิน / BILL TO</p>
                <div className="mt-2 border-t-2 pt-2.5" style={{ borderColor: INK }}>
                  <p className="text-[17px] font-bold" style={{ color: INK }}>{customer?.name ?? "—"}</p>
                  <div className="text-[15px] text-zinc-600 mt-0.5 space-y-0.5">
                    {customer?.company && <p>{customer.company}</p>}
                    {customer?.phone && <p>โทร. {customer.phone}</p>}
                    {customer?.email && <p>{customer.email}</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className={labelCls}>ผู้ออกเอกสาร / FROM</p>
                <div className="mt-2 border-t-2 pt-2.5" style={{ borderColor: INK }}>
                  <p className="text-[17px] font-bold" style={{ color: INK }}>{ISSUER.name}</p>
                  <div className="text-[15px] text-zinc-600 mt-0.5 space-y-0.5">
                    <p>{ISSUER.subname}</p>
                    <p>โดย {ISSUER.dev} · {ISSUER.role}</p>
                    <p>{ISSUER.email}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* รายละเอียดงาน */}
            <section className="mt-6 border border-zinc-200 relative z-10">
              <div className="px-4 py-2 border-b border-zinc-200 bg-zinc-50">
                <p className={labelCls}>รายละเอียดงาน</p>
              </div>
              <div className="grid grid-cols-2">
                {[
                  { label: "ชื่อโปรเจค", value: deal.title },
                  { label: "ประเภทงาน", value: PROJECT_TYPE_LABELS[deal.projectType] },
                ].map((f, i) => (
                  <div
                    key={f.label}
                    className={`flex gap-3 px-4 py-2 text-[14px] border-b border-zinc-100 ${i % 2 === 0 ? "border-r" : ""}`}
                  >
                    <span className="text-zinc-400 min-w-[140px]">{f.label}</span>
                    <span className="font-medium" style={{ color: INK }}>{f.value}</span>
                  </div>
                ))}
                {deal.description && (
                  <div className="col-span-2 px-4 py-2.5 border-t border-zinc-100 text-[14px]">
                    <span className="text-zinc-400">รายละเอียดเพิ่มเติม</span>
                    <p className="mt-1 text-zinc-700 whitespace-pre-wrap leading-relaxed">{deal.description}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Items table */}
            <section className="mt-6 relative z-10">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr style={{ background: INK, color: "#fff" }}>
                    <th className="text-center font-semibold py-2.5 w-12 px-2">#</th>
                    <th className="text-left font-semibold py-2.5 px-4">รายการ</th>
                    <th className="text-center font-semibold py-2.5 px-3 w-20">จำนวน</th>
                    <th className="text-right font-semibold py-2.5 px-4 w-36">ราคาต่อหน่วย</th>
                    <th className="text-right font-semibold py-2.5 px-4 w-40">รวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation ? (
                    quotation.items.map((item, i) => (
                      <tr key={i} className="border-b border-zinc-200">
                        <td className="text-center py-3 px-2 text-zinc-500 align-top">{i + 1}</td>
                        <td className="py-3 px-4 text-zinc-700 align-top">
                          {condensed ? (
                            <div className="space-y-0.5">
                              {(itemHeadings![i] ?? []).map((h, hi) => (
                                <div key={hi} className="flex gap-1.5">
                                  <span className="text-zinc-400 shrink-0">•</span>
                                  <span className="font-medium" style={{ color: INK }}>{h}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            item.description
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-600 align-top">{item.qty}</td>
                        <td className="py-3 px-4 text-right text-zinc-600 tabular-nums align-top">{formatBaht(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums align-top" style={{ color: INK }}>
                          {formatBaht(item.qty * item.unitPrice)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-zinc-200">
                      <td className="text-center py-3 px-2 text-zinc-500">1</td>
                      <td className="py-3 px-4 text-zinc-700">
                        <p className="font-semibold" style={{ color: INK }}>ค่าบริการพัฒนา{deal.title ? ` — ${deal.title}` : ""}</p>
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-600">1</td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-600">{formatBaht(deal.quotedAmount)}</td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums" style={{ color: INK }}>
                        {formatBaht(deal.quotedAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-[320px]">
                  {quotation && quotation.taxPercent > 0 && (() => {
                    const subtotal = quotation.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                    const tax = subtotal * (quotation.taxPercent / 100);
                    return (
                      <>
                        <div className="flex justify-between py-2.5 px-4 text-[14px] text-zinc-600 border-b border-zinc-200">
                          <span>ราคาก่อน VAT</span>
                          <span className="tabular-nums">{formatBaht(subtotal)}</span>
                        </div>
                        <div className="flex justify-between py-2.5 px-4 text-[14px] text-zinc-600 border-b border-zinc-200">
                          <span>VAT {quotation.taxPercent}%</span>
                          <span className="tabular-nums">{formatBaht(tax)}</span>
                        </div>
                      </>
                    );
                  })()}
                  {totalPaid > 0 && (
                    <div className="flex justify-between py-2.5 px-4 text-[14px] text-green-700 border-b border-zinc-200">
                      <span>ชำระแล้ว</span>
                      <span className="tabular-nums">− {formatBaht(totalPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 px-4 text-white" style={{ background: INK }}>
                    <span className="text-[15px] font-medium">{totalPaid > 0 ? "ยอดคงค้าง" : "ยอดที่ต้องชำระ"}</span>
                    <span className="text-[20px] font-bold tabular-nums">{formatBaht(totalPaid > 0 ? remaining : deal.quotedAmount)}</span>
                  </div>
                </div>
              </div>

              {/* ตัวอักษร */}
              <div className="mt-4 flex items-center gap-3 border-y border-zinc-200 py-2.5 px-4 bg-zinc-50">
                <span className={labelCls}>ตัวอักษร</span>
                <span className="text-[16px] font-semibold" style={{ color: INK }}>
                  ({bahtText(totalPaid > 0 ? remaining : deal.quotedAmount)})
                </span>
              </div>
            </section>

            {/* Payment instructions */}
            <section className="mt-6 border border-zinc-200 p-3 relative z-10">
              <p className={`${labelCls} mb-2.5`}>วิธีชำระเงิน</p>
              <div className="grid grid-cols-2 gap-3">
                {/* PromptPay box */}
                <div className="bg-zinc-50 rounded-xl p-3 flex items-center gap-3">
                  {ppQrDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ppQrDataUrl} alt="PromptPay QR" className="w-[72px] h-[72px] shrink-0 rounded" />
                  )}
                  <div className="flex flex-col gap-0.5 flex-1">
                    <p className="font-semibold text-[12px]" style={{ color: INK }}>โอนผ่านพร้อมเพย์</p>
                    <p className="text-zinc-600 text-[12px] font-medium">ธนาคารไทยพาณิชย์</p>
                    <p className="text-zinc-500 text-[12px]">เบอร์ 083-551-9787</p>
                    <p className="text-zinc-500 text-[12px]">ชื่อบัญชี: ถิร ศิริสุนทโรทัย</p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/svg/scb-logo.jpg" alt="SCB" className="w-[64px] h-[64px] object-contain shrink-0" />
                </div>
                {/* CLICX bank box */}
                <div className="bg-zinc-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <p className="font-semibold text-[12px]" style={{ color: INK }}>ธนาคาร CLICX</p>
                    <p className="text-zinc-500 text-[12px]">ชื่อบัญชี: ถิร ศิริสุนทโรทัย</p>
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wide">เลขบัญชี</p>
                    <p className="text-[22px] font-black text-red-600 tabular-nums leading-tight tracking-wide">
                      150-551-9787
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/svg/CLICX.webp" alt="CLICX" className="w-[120px] self-stretch object-contain shrink-0 rounded-lg" />
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-6 pt-4 border-t-2 border-zinc-100 flex items-start justify-between gap-8 relative z-10">
              <div className="flex-1">
                <p className="text-[15px] font-bold" style={{ color: INK }}>ขอบคุณที่ไว้วางใจ {ISSUER.name}</p>
                <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed max-w-[380px]">
                  กรุณาชำระภายในวันที่กำหนด หากมีข้อสงสัยกรุณาติดต่อทีมงาน
                </p>
                <p className="mt-2 text-[11px] text-zinc-400">
                  เอกสารนี้จัดทำโดยระบบคอมพิวเตอร์ · เลขที่อ้างอิง{" "}
                  <span className="tabular-nums font-medium text-zinc-500">{no}</span>
                </p>
              </div>
              <div className="shrink-0 text-center">
                <div className="rounded-xl border border-zinc-200 p-2 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/id%20line%20kao.jpg" alt="LINE QR" className="w-[100px] h-[100px] object-contain" />
                </div>
                <p className="mt-1.5 text-[12px] font-semibold" style={{ color: "#06C755" }}>สแกนเพื่อแอดไลน์</p>
                <p className="text-[11px] text-zinc-400 leading-tight">ติดต่อ / สอบถามงาน</p>
              </div>
            </footer>
          </div>

          {/* แถบสีแบรนด์ด้านล่าง */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "6px", background: BRAND_GRADIENT }} />
        </div>
      </ReceiptFrame>

      <ReceiptActions filename={no} />
    </div>
  );
}
