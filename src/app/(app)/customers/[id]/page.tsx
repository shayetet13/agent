import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { deleteQuotation } from "@/actions/quotations";
import { DeleteButton } from "@/components/DeleteButton";
import { formatDecimal, formatBaht, formatDate } from "@/lib/format";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS, type QuotationStatus } from "@/lib/types";
import { PaymentSlips } from "@/components/PaymentSlips";

function QuotationStatusBadge({ status }: { status: string }) {
  const label = QUOTATION_STATUS_LABELS[status as QuotationStatus] ?? status;
  const cls = QUOTATION_STATUS_COLORS[status as QuotationStatus] ?? "bg-slate-100 text-slate-500";
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");

  const { id } = await params;
  const data = await getData();
  const customer = data.customers.find((c) => c.id === id);
  if (!customer) notFound();

  const deals = data.deals.filter((d) => d.customerId === id);
  const dealsWithPayments = deals
    .map((deal) => ({
      deal,
      payments: data.payments.filter((p) => p.dealId === deal.id).sort((a, b) => a.paidAt.localeCompare(b.paidAt)),
    }))
    .filter(({ payments }) => payments.length > 0);
  const quotations = data.quotations
    .filter((q) => q.customerId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-1">
            <Link href="/customers" className="hover:text-accent">ลูกค้า</Link>
            <span>/</span>
            <span>{customer.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          {customer.company && <p className="text-muted text-sm mt-0.5">{customer.company}</p>}
        </div>
        <Link
          href={`/customers/${id}/edit`}
          className="shrink-0 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 transition-colors"
        >
          แก้ไข
        </Link>
      </div>

      {/* Info card */}
      <div className="bg-surface border border-border rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted mb-1">เบอร์โทร</p>
          <p className="font-medium">{customer.phone || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">อีเมล</p>
          <p className="font-medium">{customer.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">แหล่งที่มา</p>
          <p className="font-medium">{customer.source || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">ดีลทั้งหมด</p>
          <Link href={`/deals?customerId=${id}`} className="font-medium text-accent hover:underline">
            {deals.length} ดีล
          </Link>
        </div>
        {customer.website && (
          <div className="col-span-2 sm:col-span-4 border-t border-border pt-4 mt-1">
            <p className="text-xs text-muted mb-1">เว็บไซต์</p>
            <a
              href={customer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline break-all"
            >
              {customer.website}
            </a>
          </div>
        )}
        {customer.note && (
          <div className="col-span-2 sm:col-span-4 border-t border-border pt-4 mt-1">
            <p className="text-xs text-muted mb-1">หมายเหตุ</p>
            <p className="text-sm text-foreground">{customer.note}</p>
          </div>
        )}
      </div>

      {/* การชำระเงิน + สลิป */}
      {dealsWithPayments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">การชำระเงิน ({dealsWithPayments.length} โปรเจค)</h2>
          <div className="flex flex-col gap-3">
            {dealsWithPayments.map(({ deal, payments }) => {
              const total = payments.reduce((s, p) => s + p.amount, 0);
              return (
                <div key={deal.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                  {/* Deal header */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/deals/${deal.id}`} className="font-semibold text-sm hover:text-accent transition-colors">
                        {deal.title}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">รับแล้ว {payments.length} งวด · รวม <span className="font-semibold text-emerald-700">{formatBaht(total)}</span></p>
                    </div>
                    <Link
                      href={`/customer-receipt/${deal.id}`}
                      target="_blank"
                      className="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ใบเสร็จ
                    </Link>
                  </div>

                  {/* Payment rows */}
                  <div className="divide-y divide-border">
                    {payments.map((payment, i) => (
                      <div key={payment.id} className="px-4 py-3 flex flex-col gap-2">
                        {/* Payment info row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-muted">{formatDate(payment.paidAt)}</span>
                            {payment.isFirstPayment && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">มัดจำ</span>
                            )}
                            {payment.note && (
                              <span className="text-muted text-xs hidden sm:inline truncate max-w-[160px]">{payment.note}</span>
                            )}
                          </div>
                          <span className="font-semibold text-sm text-emerald-700 tabular-nums shrink-0">{formatBaht(payment.amount)}</span>
                        </div>

                        {/* Slips */}
                        <PaymentSlips
                          paymentId={payment.id}
                          customerId={id}
                          initialSlipUrls={payment.slipUrls ?? []}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quotations */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">ใบเสนอราคา ({quotations.length})</h2>
          <Link
            href={`/customers/${id}/quotations/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + สร้างใบเสนอราคา
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {quotations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-muted text-sm">ยังไม่มีใบเสนอราคา</p>
              <Link
                href={`/customers/${id}/quotations/new`}
                className="mt-3 inline-flex text-sm text-accent hover:underline"
              >
                สร้างใบแรก →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">เลขที่</th>
                  <th className="text-left px-4 py-2.5 font-medium">ชื่อโปรเจค</th>
                  <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">มูลค่ารวม</th>
                  <th className="text-center px-4 py-2.5 font-medium">สถานะ</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">วันที่</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotations.map((q) => {
                  const subtotal = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                  const tax = subtotal * (q.taxPercent / 100);
                  const total = subtotal + tax;
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-muted">{q.number}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/quotation/${q.id}`} className="hover:text-accent" target="_blank">
                          {q.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">฿{formatDecimal(total)}</td>
                      <td className="px-4 py-3 text-center">
                        <QuotationStatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3 text-muted hidden md:table-cell">
                        {new Date(q.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/quotation/${q.id}`}
                            target="_blank"
                            className="text-xs px-2 py-1 rounded border border-border hover:bg-slate-50 transition-colors"
                          >
                            เปิด
                          </Link>
                          <DeleteButton
                            action={deleteQuotation}
                            id={q.id}
                            confirmTitle="ลบใบเสนอราคา"
                            confirmMessage={`ต้องการลบใบเสนอราคา "${q.number}" ออกจากระบบ?`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
