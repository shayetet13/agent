import { notFound, redirect } from "next/navigation";
import { Sarabun } from "next/font/google";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht, formatDateLong } from "@/lib/format";
import { bahtText } from "@/lib/bahttext";
import { receiptNo } from "@/lib/receipt";
import { DEAL_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/types";
import { COMPANY as ISSUER, DOC_INK as INK, DOC_GRADIENT as BRAND_GRADIENT, DOC_LABEL_CLS as labelCls } from "@/lib/constants";
import { ReceiptActions } from "@/components/ReceiptActions";
import { ReceiptFrame } from "@/components/ReceiptFrame";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session] = await Promise.all([getData(), getSession()]);

  if (!session) redirect("/login");

  const payout = data.payouts.find((p) => p.id === id);
  if (!payout) notFound();

  if (session.type === "broker" && payout.agentId !== session.agentId) redirect("/");

  const agent = data.agents.find((a) => a.id === payout.agentId);
  const deal = data.deals.find((d) => d.id === payout.dealId);
  const customer = deal ? data.customers.find((c) => c.id === deal.customerId) : null;
  const payment = payout.paymentId ? data.payments.find((p) => p.id === payout.paymentId) : null;

  const isPaid = payout.status === "paid";
  const no = payout.receiptNumber ?? receiptNo(payout.id, payout.paidAt);

  const dealFacts: { label: string; value: string }[] = [
    { label: "ชื่อดีล", value: deal?.title ?? "" },
    { label: "ลูกค้า", value: customer?.name ?? "" },
    { label: "บริษัทลูกค้า", value: customer?.company ?? "" },
    { label: "ประเภทงาน", value: deal ? PROJECT_TYPE_LABELS[deal.projectType] : "" },
    { label: "มูลค่างาน (เสนอราคา)", value: deal ? formatBaht(deal.quotedAmount) : "" },
    { label: "สถานะดีล", value: deal ? DEAL_STATUS_LABELS[deal.status] : "" },
    { label: "อัตราค่าคอมมิชชัน", value: deal && deal.commissionValue > 0 ? `${deal.commissionValue}%` : "" },
    { label: "จากยอดรับเงิน", value: payment ? formatBaht(payment.amount) : "" },
    { label: "วันที่รับเงิน", value: payment ? formatDateLong(payment.paidAt) : "" },
  ].filter((f) => f.value);

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
        {/* ── A4 sheet (794×1123px = A4 @96dpi) ── */}
        <div
          className="sheet relative bg-white shadow-[0_10px_40px_-12px_rgba(0,0,0,0.3)]"
          style={{ width: "794px", minHeight: "1123px" }}
        >
          {/* แถบสีแบรนด์ด้านบน */}
          <div style={{ height: "6px", background: BRAND_GRADIENT }} />

          {/* ── ตราประทับกลางกระดาษ (จาง 50%) ── */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
            {isPaid ? (
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
                <p className="text-[66px] font-extrabold leading-none tracking-wider">ฉบับร่าง</p>
                <p className="text-[20px] tracking-[0.4em] mt-2.5">DRAFT</p>
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
                <p className={labelCls}>วันที่ชำระ</p>
                <p className="text-[15px] font-semibold mt-1" style={{ color: INK }}>{formatDateLong(payout.paidAt)}</p>
              </div>
              <div className="px-4 py-3">
                <p className={labelCls}>สถานะ</p>
                <p className={`text-[15px] font-semibold mt-1 ${isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                  {isPaid ? "ชำระเงินเรียบร้อย" : "รอชำระ (ฉบับร่าง)"}
                </p>
              </div>
            </div>

            {/* ── Parties ── */}
            <section className="mt-6 grid grid-cols-2 gap-10 relative z-10">
              <div>
                <p className={labelCls}>จ่ายโดย / FROM</p>
                <div className="mt-2 border-t-2 pt-2.5" style={{ borderColor: INK }}>
                  <p className="text-[17px] font-bold" style={{ color: INK }}>{ISSUER.name}</p>
                  <p className="text-[15px] text-zinc-600 mt-0.5">โดย {ISSUER.dev} · {ISSUER.role}</p>
                </div>
              </div>
              <div>
                <p className={labelCls}>จ่ายให้ / TO</p>
                <div className="mt-2 border-t-2 pt-2.5" style={{ borderColor: INK }}>
                  <p className="text-[17px] font-bold" style={{ color: INK }}>{agent?.name ?? "—"}</p>
                  <div className="text-[15px] text-zinc-600 mt-0.5 space-y-0.5">
                    {agent?.phone && <p>โทร. {agent.phone}</p>}
                    {agent?.promptpay && <p>PromptPay {agent.promptpay}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* ── รายละเอียดดีล ── */}
            {(dealFacts.length > 0 || deal?.description) && (
              <section className="mt-6 border border-zinc-200 relative z-10">
                <div className="px-4 py-2 border-b border-zinc-200 bg-zinc-50">
                  <p className={labelCls}>รายละเอียดดีล</p>
                </div>
                <div className="grid grid-cols-2">
                  {dealFacts.map((f, i) => (
                    <div key={f.label} className={`flex gap-3 px-4 py-2 text-[14px] border-b border-zinc-100 ${i % 2 === 0 ? "border-r" : ""}`}>
                      <span className="text-zinc-400 min-w-[150px]">{f.label}</span>
                      <span className="font-medium" style={{ color: INK }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                {deal?.description && (
                  <div className="px-4 py-2.5 border-t border-zinc-100 text-[14px]">
                    <span className="text-zinc-400">รายละเอียดงาน</span>
                    <p className="mt-1 text-zinc-700 whitespace-pre-wrap leading-relaxed">{deal.description}</p>
                  </div>
                )}
              </section>
            )}

            {/* ── Items table ── */}
            <section className="mt-6 relative z-10">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr style={{ background: INK, color: "#fff" }}>
                    <th className="text-center font-semibold py-2.5 w-12 px-2">ลำดับ</th>
                    <th className="text-left font-semibold py-2.5 px-4">รายการ</th>
                    <th className="text-right font-semibold py-2.5 px-4 w-44 whitespace-nowrap">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 align-top">
                    <td className="text-center py-4 px-2 text-zinc-500 tabular-nums">1</td>
                    <td className="py-4 px-4">
                      <p className="text-[16px] font-semibold" style={{ color: INK }}>ค่าคอมมิชชันนายหน้า</p>
                      <p className="mt-1 text-[14px] text-zinc-500">
                        {agent?.name ? `สำหรับ ${agent.name}` : ""}
                        {deal?.title ? ` · ดีล ${deal.title}` : ""}
                      </p>
                    </td>
                    <td className="text-right py-4 px-4 text-[16px] tabular-nums font-medium" style={{ color: INK }}>
                      {formatBaht(payout.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ── Totals ── */}
              <div className="flex justify-end">
                <div className="w-[320px]">
                  <div className="flex justify-between py-2.5 px-4 text-[15px] text-zinc-600 border-b border-zinc-200">
                    <span>รวมเป็นเงิน</span>
                    <span className="tabular-nums">{formatBaht(payout.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 text-white" style={{ background: INK }}>
                    <span className="text-[15px] font-medium">จำนวนเงินที่ชำระทั้งสิ้น</span>
                    <span className="text-[20px] font-bold tabular-nums">{formatBaht(payout.amount)}</span>
                  </div>
                </div>
              </div>

              {/* ── จำนวนเงินตัวอักษร ── */}
              <div className="mt-4 flex items-center gap-3 border-y border-zinc-200 py-2.5 px-4 bg-zinc-50">
                <span className={labelCls}>ตัวอักษร</span>
                <span className="text-[16px] font-semibold" style={{ color: INK }}>({bahtText(payout.amount)})</span>
              </div>
            </section>

            {/* ── Signatures ── */}
            <section className="mt-12 grid grid-cols-2 gap-16 relative z-10">
              <div className="text-center">
                <div className="h-[60px]" />
                <div className="border-t border-zinc-400 pt-2 mx-6">
                  <p className="text-[15px] font-semibold" style={{ color: INK }}>( {agent?.name ?? "ผู้รับเงิน"} )</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5">ผู้รับเงิน</p>
                </div>
              </div>
              <div className="text-center">
                <div className="h-[60px] flex items-end justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sing.png" alt="ลายเซ็น" className="h-[58px] object-contain -mb-1" />
                </div>
                <div className="border-t border-zinc-400 pt-2 mx-6">
                  <p className="text-[15px] font-semibold" style={{ color: INK }}>( {ISSUER.dev} )</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5">ผู้จ่ายเงิน · {ISSUER.role}</p>
                </div>
              </div>
            </section>

            {/* ── Footer + LINE QR ── */}
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
