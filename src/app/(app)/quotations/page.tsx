import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { formatDecimal, formatDateLong } from "@/lib/format";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS, type QuotationStatus } from "@/lib/types";

export default async function QuotationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getData();

  let quotations = data.quotations;

  // Brokers only see their own quotations
  if (session.type === "broker") {
    quotations = quotations.filter((q) => q.agentId === session.agentId);
  }

  // Sort by created date, newest first
  quotations = [...quotations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Count by status
  const statusCounts = {
    draft: quotations.filter((q) => q.status === "draft").length,
    sent: quotations.filter((q) => q.status === "sent").length,
    approved: quotations.filter((q) => q.status === "approved").length,
    rejected: quotations.filter((q) => q.status === "rejected").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">ใบเสนอราคา</h1>
        <p className="text-muted mt-1">จำนวน {quotations.length} รายการ</p>
      </div>

      {/* Status Summary (for admin) */}
      {session.type === "admin" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-sm text-muted">ร่าง</p>
            <p className="text-2xl font-bold text-slate-700">{statusCounts.draft}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-sm text-muted">ส่งแล้ว</p>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.sent}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-sm text-muted">อนุมัติแล้ว</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-sm text-muted">ปฏิเสธ</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
          </div>
        </div>
      )}

      {/* List */}
      {quotations.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-muted">ไม่มีใบเสนอราคา</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">โปรเจค</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">ยอดรวม</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">สถานะ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">วันที่สร้าง</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  const customer = data.customers.find((c) => c.id === q.customerId);
                  const subtotal = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
                  const tax = subtotal * (q.taxPercent / 100);
                  const total = subtotal + tax;

                  return (
                    <tr key={q.id} className="border-b border-border hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">{q.number}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{customer?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{q.title}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-700">฿{formatDecimal(total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${QUOTATION_STATUS_COLORS[q.status as QuotationStatus]}`}>
                          {QUOTATION_STATUS_LABELS[q.status as QuotationStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDateLong(q.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="text-sm text-accent hover:underline font-medium"
                        >
                          ดู
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
