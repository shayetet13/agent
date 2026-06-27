import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { formatDecimal, formatDateLong } from "@/lib/format";
import { updateQuotationStatus } from "@/actions/quotations";
import { DEAL_STATUS_LABELS, QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS, type QuotationStatus } from "@/lib/types";

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const data = await getData();
  const q = data.quotations.find((x) => x.id === id);
  if (!q) notFound();

  // Brokers can only see their own quotations
  if (session.type === "broker" && q.agentId !== session.agentId) {
    notFound();
  }

  const customer = data.customers.find((c) => c.id === q.customerId);
  const deal = data.deals.find((d) => d.id === q.dealId);
  const subtotal = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tax = subtotal * (q.taxPercent / 100);
  const total = subtotal + tax;

  // Get payments for the linked deal
  const payments = deal ? data.payments.filter((p) => p.dealId === deal.id) : [];
  const payouts = deal ? data.payouts.filter((p) => p.dealId === deal.id && p.agentId === q.agentId) : [];

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/customers/${q.customerId}`} className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{q.number}</h1>
          <p className="text-muted mt-1">สร้างเมื่อ {formatDateLong(q.createdAt)}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${QUOTATION_STATUS_COLORS[q.status as QuotationStatus]}`}>
          {QUOTATION_STATUS_LABELS[q.status as QuotationStatus]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Customer Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-semibold text-slate-700 mb-4">ข้อมูลลูกค้า</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted">ชื่อ:</span>{" "}
                <span className="text-slate-700">{customer?.name ?? "—"}</span>
              </p>
              {customer?.company && (
                <p className="text-sm">
                  <span className="text-muted">บริษัท:</span>{" "}
                  <span className="text-slate-700">{customer.company}</span>
                </p>
              )}
              {customer?.phone && (
                <p className="text-sm">
                  <span className="text-muted">โทร:</span>{" "}
                  <span className="text-slate-700">{customer.phone}</span>
                </p>
              )}
              {customer?.email && (
                <p className="text-sm">
                  <span className="text-muted">อีเมล:</span>{" "}
                  <span className="text-slate-700">{customer.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quotation Details */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-semibold text-slate-700 mb-4">รายการ</h2>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted">#</th>
                    <th className="text-left py-2 text-muted">รายละเอียด</th>
                    <th className="text-center py-2 text-muted w-20">จำนวน</th>
                    <th className="text-right py-2 text-muted w-32">ราคาต่อหน่วย</th>
                    <th className="text-right py-2 text-muted w-32">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((item, i) => {
                    const rowTotal = item.qty * item.unitPrice;
                    return (
                      <tr key={i} className="border-b border-border">
                        <td className="py-2 text-slate-600">{i + 1}</td>
                        <td className="py-2 text-slate-700">{item.description}</td>
                        <td className="py-2 text-center text-slate-600">{item.qty}</td>
                        <td className="py-2 text-right text-slate-600">฿{formatDecimal(item.unitPrice)}</td>
                        <td className="py-2 text-right text-slate-700 font-medium">฿{formatDecimal(rowTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm flex justify-end flex-col items-end max-w-xs">
              <div className="flex justify-between w-full">
                <span className="text-muted">ราคาก่อน VAT:</span>
                <span className="font-medium text-slate-700">฿{formatDecimal(subtotal)}</span>
              </div>
              {q.taxPercent > 0 && (
                <div className="flex justify-between w-full">
                  <span className="text-muted">VAT {q.taxPercent}%:</span>
                  <span className="font-medium text-slate-700">฿{formatDecimal(tax)}</span>
                </div>
              )}
              <div className="flex justify-between w-full border-t border-border pt-2 mt-2">
                <span className="font-semibold text-slate-700">รวมทั้งสิ้น:</span>
                <span className="font-bold text-lg text-accent">฿{formatDecimal(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {q.notes && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <h2 className="font-semibold text-slate-700 mb-3">หมายเหตุ / เงื่อนไข</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{q.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Status control — admin only */}
          {session.type === "admin" && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="font-semibold text-slate-700 mb-1">สถานะใบเสนอราคา</h3>
              <p className="text-xs text-muted mb-4">ปัจจุบัน: {QUOTATION_STATUS_LABELS[q.status as QuotationStatus]}</p>
              <div className="flex flex-col gap-2">
                {q.status === "draft" && (
                  <StatusButton id={q.id} status="sent" label="📤 ทำเครื่องหมายว่าส่งแล้ว" tone="blue" />
                )}
                {q.status === "sent" && (
                  <>
                    <StatusButton id={q.id} status="approved" label="✓ ลูกค้าอนุมัติแล้ว" tone="green" />
                    <StatusButton id={q.id} status="rejected" label="✗ ลูกค้าปฏิเสธ" tone="red" />
                  </>
                )}
                {(q.status === "approved" || q.status === "rejected" || q.status === "sent") && (
                  <StatusButton id={q.id} status="draft" label="↩ กลับเป็นร่าง" tone="slate" />
                )}
              </div>
            </div>
          )}

          {/* Quotation Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="font-semibold text-slate-700 mb-3">ข้อมูลใบเสนอราคา</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted">ยืนราคา:</span>{" "}
                <span className="text-slate-700">{q.validDays} วัน</span>
              </p>
              <p>
                <span className="text-muted">ถึง:</span>{" "}
                <span className="text-slate-700">
                  {formatDateLong(new Date(new Date(q.createdAt).getTime() + q.validDays * 86400_000))}
                </span>
              </p>
            </div>
          </div>

          {/* Deal Status (if exists) */}
          {deal && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="font-semibold text-slate-700 mb-4">สถานะดีล</h3>
              <Link
                href={`/deals/${deal.id}`}
                className="block mb-4 text-accent hover:underline text-sm font-medium"
              >
                ดูรายละเอียดดีล →
              </Link>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">สถานะ</p>
                  <p className="text-sm font-semibold text-slate-700">{DEAL_STATUS_LABELS[deal.status]}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">ยอดโครงการ</p>
                  <p className="text-sm font-semibold text-slate-700">฿{formatDecimal(deal.quotedAmount)}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">ค่าคอม</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {deal.commissionValue}%
                  </p>
                </div>

                {/* Payments */}
                {payments.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted mb-2">การรับเงิน</p>
                    <div className="space-y-1">
                      {payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs">
                          <span className="text-slate-600">
                            {p.isFirstPayment ? "ก้อนแรก" : "ก้อนต่อไป"}
                          </span>
                          <span className="font-semibold text-slate-700">฿{formatDecimal(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commission Payouts */}
                {payouts.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-semibold mb-2">ค่าคอมค้างรับ</p>
                    <div className="space-y-1">
                      {payouts.map((payout) => (
                        <div key={payout.id} className="flex justify-between text-xs">
                          <span className="text-amber-700">
                            {payout.status === "pending" ? "ค้างจ่าย" : "จ่ายแล้ว"}
                          </span>
                          <span className="font-semibold text-amber-700">฿{formatDecimal(payout.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View as PDF */}
          <Link
            href={`/quotation/${q.id}`}
            className="block w-full px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-indigo-700 transition-colors text-center"
          >
            ดูใบเสนอราคาเต็มหน้า
          </Link>
        </div>
      </div>
    </div>
  );
}

const STATUS_BTN_TONES: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
  red: "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
  slate: "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
};

function StatusButton({
  id,
  status,
  label,
  tone,
}: {
  id: string;
  status: QuotationStatus;
  label: string;
  tone: keyof typeof STATUS_BTN_TONES;
}) {
  return (
    <form action={updateQuotationStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${STATUS_BTN_TONES[tone]}`}
      >
        {label}
      </button>
    </form>
  );
}
