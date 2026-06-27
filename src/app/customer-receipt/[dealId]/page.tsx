import { notFound, redirect } from "next/navigation";
import { Sarabun } from "next/font/google";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht, formatDateLong } from "@/lib/format";
import { bahtText } from "@/lib/bahttext";
import { customerReceiptNo } from "@/lib/receipt";
import { PROJECT_TYPE_LABELS } from "@/lib/types";
import { COMPANY as ISSUER, DOC_INK as INK, DOC_GRADIENT as BRAND_GRADIENT, DOC_LABEL_CLS as labelCls } from "@/lib/constants";
import { ReceiptActions } from "@/components/ReceiptActions";
import { ReceiptFrame } from "@/components/ReceiptFrame";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export default async function CustomerReceiptPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const [data, session] = await Promise.all([getData(), getSession()]);

  if (session?.type !== "admin") redirect("/login");

  const deal = data.deals.find((d) => d.id === dealId);
  if (!deal) notFound();

  const customer = data.customers.find((c) => c.id === deal.customerId);
  const payments = data.payments
    .filter((p) => p.dealId === dealId)
    .sort((a, b) => a.paidAt.localeCompare(b.paidAt));

  if (payments.length === 0) notFound();

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const isPaidInFull = totalPaid >= deal.quotedAmount;
  const remaining = Math.max(0, deal.quotedAmount - totalPaid);

  const firstDate = payments[0].paidAt;
  const lastDate = payments[payments.length - 1].paidAt;
  const no = customerReceiptNo(dealId, firstDate);

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

          {/* ── ตราประทับกลางกระดาษ ── */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
            {isPaidInFull ? (
              <div
                className="border-[5px] rounded-2xl px-12 py-5 text-center"
                style={{ borderColor: "rgba(220,38,38,0.22)", color: "rgba(220,38,38,0.25)", transform: "rotate(-13deg)" }}
              >
                <p className="text-[66px] font-extrabold leading-none tracking-wider">ชำระเงินแล้ว</p>
                <p className="text-[20px] tracking-[0.4em] mt-2.5">PAID IN FULL</p>
              </div>
            ) : (
              <div
                className="border-[5px] rounded-2xl px-12 py-5 text-center"
                style={{ borderColor: "rgba(161,161,170,0.22)", color: "rgba(113,113,122,0.22)", transform: "rotate(-13deg)" }}
              >
                <p className="text-[66px] font-extrabold leading-none tracking-wider">ชำระบางส่วน</p>
                <p className="text-[20px] tracking-[0.4em] mt-2.5">PARTIAL PAYMENT</p>
              </div>
            )}
          </div>

          <div className="px-12 pt-9 pb-10">
            {/* ── Letterhead ── */}
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
                <h2 className="text-[24px] font-bold leading-none tracking-tight" style={{ color: INK }}>ใบเสร็จรับเงิน</h2>
                <p className="text-[13px] font-medium tracking-[0.3em] text-zinc-400 mt-1.5">OFFICIAL RECEIPT</p>
              </div>
            </header>

            <div className="mt-5 h-px w-full" style={{ background: BRAND_GRADIENT }} />

            {/* ── Meta strip ── */}
            <div className="mt-5 grid grid-cols-3 border border-zinc-200 relative z-10">
              <div className="px-4 py-3 border-r border-zinc-200">
                <p className={labelCls}>เลขที่เอกสาร</p>
                <p className="text-[15px] font-semibold mt-1 tabular-nums" style={{ color: INK }}>{no}</p>
              </div>
              <div className="px-4 py-3 border-r border-zinc-200">
                <p className={labelCls}>วันที่ชำระล่าสุด</p>
                <p className="text-[15px] font-semibold mt-1" style={{ color: INK }}>{formatDateLong(lastDate)}</p>
              </div>
              <div className="px-4 py-3">
                <p className={labelCls}>สถานะ</p>
                <p className={`text-[15px] font-semibold mt-1 ${isPaidInFull ? "text-emerald-600" : "text-amber-600"}`}>
                  {isPaidInFull ? "ชำระครบแล้ว" : `ชำระแล้ว ${payments.length} งวด`}
                </p>
              </div>
            </div>

            {/* ── Parties ── */}
            <section className="mt-6 grid grid-cols-2 gap-10 relative z-10">
              <div>
                <p className={labelCls}>จ่ายโดย / FROM</p>
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
                <p className={labelCls}>รับโดย / TO</p>
                <div className="mt-2 border-t-2 pt-2.5" style={{ borderColor: INK }}>
                  <p className="text-[17px] font-bold" style={{ color: INK }}>{ISSUER.name}</p>
                  <div className="text-[15px] text-zinc-600 mt-0.5 space-y-0.5">
                    <p>โดย {ISSUER.dev} · {ISSUER.role}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── รายละเอียดงาน ── */}
            <section className="mt-6 border border-zinc-200 relative z-10">
              <div className="px-4 py-2 border-b border-zinc-200 bg-zinc-50">
                <p className={labelCls}>รายละเอียดงาน</p>
              </div>
              <div className="grid grid-cols-2">
                {[
                  { label: "ชื่อโปรเจค", value: deal.title },
                  { label: "ประเภทงาน", value: PROJECT_TYPE_LABELS[deal.projectType] },
                  { label: "ราคาโปรเจค", value: formatBaht(deal.quotedAmount) },
                  { label: "วันที่ชำระแรก", value: formatDateLong(firstDate) },
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

            {/* ── Items table ── */}
            <section className="mt-6 relative z-10">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr style={{ background: INK, color: "#fff" }}>
                    <th className="text-center font-semibold py-2.5 w-12 px-2">งวด</th>
                    <th className="text-left font-semibold py-2.5 px-4">รายการ</th>
                    <th className="text-center font-semibold py-2.5 px-3 w-36">วันที่ชำระ</th>
                    <th className="text-right font-semibold py-2.5 px-4 w-40 whitespace-nowrap">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, i) => (
                    <tr key={payment.id} className="border-b border-zinc-200 align-top">
                      <td className="text-center py-4 px-2 text-zinc-500 tabular-nums">{i + 1}</td>
                      <td className="py-4 px-4">
                        <p className="text-[15px] font-semibold" style={{ color: INK }}>
                          ค่าบริการ{payments.length > 1 ? ` งวดที่ ${i + 1}` : ""}
                          {payment.isFirstPayment && payments.length > 1 ? " (มัดจำ)" : ""}
                        </p>
                        {payment.note && (
                          <p className="mt-0.5 text-[13px] text-zinc-500">{payment.note}</p>
                        )}
                      </td>
                      <td className="text-center py-4 px-3 text-[13px] text-zinc-500 tabular-nums">
                        {formatDateLong(payment.paidAt)}
                      </td>
                      <td className="text-right py-4 px-4 text-[16px] tabular-nums font-medium" style={{ color: INK }}>
                        {formatBaht(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Totals ── */}
              <div className="flex justify-end">
                <div className="w-[320px]">
                  {payments.length > 1 && (
                    <div className="flex justify-between py-2.5 px-4 text-[15px] text-zinc-600 border-b border-zinc-200">
                      <span>รวมทั้ง {payments.length} งวด</span>
                      <span className="tabular-nums">{formatBaht(totalPaid)}</span>
                    </div>
                  )}
                  {!isPaidInFull && remaining > 0 && (
                    <div className="flex justify-between py-2.5 px-4 text-[14px] text-amber-700 border-b border-zinc-200">
                      <span>คงเหลือ</span>
                      <span className="tabular-nums">{formatBaht(remaining)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 px-4 text-white" style={{ background: INK }}>
                    <span className="text-[15px] font-medium">ยอดที่ชำระแล้วทั้งสิ้น</span>
                    <span className="text-[20px] font-bold tabular-nums">{formatBaht(totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* ── จำนวนเงินตัวอักษร ── */}
              <div className="mt-4 flex items-center gap-3 border-y border-zinc-200 py-2.5 px-4 bg-zinc-50">
                <span className={labelCls}>ตัวอักษร</span>
                <span className="text-[16px] font-semibold" style={{ color: INK }}>({bahtText(totalPaid)})</span>
              </div>
            </section>

            {/* ── Signatures ── */}
            <section className="mt-12 grid grid-cols-2 gap-16 relative z-10">
              <div className="text-center">
                <div className="h-[60px]" />
                <div className="border-t border-zinc-400 pt-2 mx-6">
                  <p className="text-[15px] font-semibold" style={{ color: INK }}>( {customer?.name ?? "ผู้ชำระเงิน"} )</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5">ผู้ชำระเงิน</p>
                </div>
              </div>
              <div className="text-center">
                <div className="h-[60px] flex items-end justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sing.png" alt="ลายเซ็น" className="h-[58px] object-contain -mb-1" />
                </div>
                <div className="border-t border-zinc-400 pt-2 mx-6">
                  <p className="text-[15px] font-semibold" style={{ color: INK }}>( {ISSUER.dev} )</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5">ผู้รับเงิน · {ISSUER.role}</p>
                </div>
              </div>
            </section>

            {/* ── Footer ── */}
            <footer className="mt-6 pt-4 border-t-2 border-zinc-100 flex items-start justify-between gap-8 relative z-10">
              <div className="flex-1">
                <p className="text-[15px] font-bold" style={{ color: INK }}>ขอบคุณที่ไว้วางใจ {ISSUER.name}</p>
                <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed max-w-[380px]">
                  เราพร้อมดูแลงานพัฒนาเว็บไซต์และระบบของคุณอย่างมืออาชีพ
                  สอบถามหรือยืนยันความถูกต้องของเอกสารได้ทาง LINE Official
                </p>
                <p className="mt-2 text-[11px] text-zinc-400">
                  เอกสารนี้จัดทำโดยระบบคอมพิวเตอร์ ใช้เป็นหลักฐานได้โดยไม่ต้องประทับตรา · เลขที่อ้างอิง{" "}
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
