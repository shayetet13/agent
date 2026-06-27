import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { markPayoutPaid } from "@/actions/payouts";
import { formatBaht, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui";
import Link from "next/link";
import { PayoutQRButton } from "@/components/PayoutQRButton";
import { PayoutUndoButton } from "@/components/PayoutUndoButton";
import { PayoutDeleteButton } from "@/components/PayoutDeleteButton";
import { ActionButton } from "@/components/ActionButton";

export default async function PayoutsPage() {
  const [data, session] = await Promise.all([getData(), getSession()]);
  const isBroker = session?.type === "broker";
  const brokerId = session?.agentId ?? null;

  const allPayouts = isBroker
    ? data.payouts.filter((p) => p.agentId === brokerId)
    : data.payouts;

  const payouts = [...allPayouts].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const dealMap = Object.fromEntries(data.deals.map((d) => [d.id, d.title]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));
  const agentPromptpayMap = Object.fromEntries(
    data.agents.filter((a) => a.promptpay).map((a) => [a.id, a.promptpay!])
  );

  const totalPending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isBroker ? "ค่าคอมของฉัน" : "ค่าคอมนายหน้า"}</h1>
        {!isBroker && (
          <a
            href="/api/export/payouts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            ↓ Export CSV
          </a>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-amber-700 font-medium uppercase tracking-wide">
            {isBroker ? "ค้างรับ" : "ค้างจ่าย"}
          </span>
          <span className="text-2xl font-bold text-amber-900">{formatBaht(totalPending)}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-green-700 font-medium uppercase tracking-wide">
            {isBroker ? "รับแล้ว" : "จ่ายแล้ว"}
          </span>
          <span className="text-2xl font-bold text-green-900">{formatBaht(totalPaid)}</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {payouts.length === 0 ? (
          <p className="px-4 py-12 text-center text-muted text-sm">
            {isBroker
              ? "ยังไม่มีค่าคอม"
              : "ยังไม่มีค่าคอม — จะเกิดขึ้นเมื่อบันทึก \"เงินก้อนแรก\" ในดีลที่มีนายหน้า"
            }
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                {!isBroker && <th className="text-left px-4 py-2 font-medium">นายหน้า</th>}
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">ดีล</th>
                <th className="text-right px-4 py-2 font-medium">ค่าคอม</th>
                <th className="text-center px-4 py-2 font-medium">สถานะ</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">วันที่จ่าย</th>
                {!isBroker && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((payout) => {
                const pp = agentPromptpayMap[payout.agentId];
                return (
                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                  {!isBroker && (
                    <td className="px-4 py-3">
                      <span className="font-medium">{agentMap[payout.agentId] ?? "—"}</span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">
                    <Link href={`/deals/${payout.dealId}`} className="hover:text-accent">
                      {dealMap[payout.dealId] ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatBaht(payout.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={payout.status === "paid" ? "success" : "warning"}>
                      {payout.status === "paid" ? (isBroker ? "รับแล้ว" : "จ่ายแล้ว") : (isBroker ? "รอรับ" : "ค้างจ่าย")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{formatDate(payout.paidAt)}</td>
                  {!isBroker && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status === "pending" && pp && (
                          <PayoutQRButton
                            promptpay={pp}
                            amount={payout.amount}
                            agentName={agentMap[payout.agentId]}
                          />
                        )}
                        {payout.status === "pending" && (
                          <PayoutDeleteButton payoutId={payout.id} />
                        )}
                        {payout.status === "pending" ? (
                          <ActionButton
                            action={markPayoutPaid}
                            fields={{ id: payout.id }}
                            label="✓ จ่ายแล้ว"
                            pendingLabel="…"
                            className="text-xs px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          />
                        ) : (
                          <>
                            <Link
                              href={`/receipt/${payout.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              ใบเสร็จ
                            </Link>
                            <PayoutUndoButton payoutId={payout.id} />
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
