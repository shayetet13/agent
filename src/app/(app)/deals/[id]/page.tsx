import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { deleteDeal, deletePayment, changeDealStatus } from "@/actions/deals";
import { formatBaht, formatDate, todayISO } from "@/lib/format";
import { DEAL_STATUS_LABELS, DEAL_STATUS_ORDER, PROJECT_TYPE_LABELS, statusVariant, EVENT_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui";
import { CollapsiblePaymentForm } from "@/components/CollapsiblePaymentForm";
import { DeleteButton, DeleteDealButton } from "@/components/DeleteButton";
import { ActionButton } from "@/components/ActionButton";
import { SlipUpload } from "@/components/SlipUpload";
import { NoteForm, NotesList } from "@/components/NoteForm";
import { CancelUnlockButton } from "@/components/CancelUnlockButton";
import { promptPayQRString } from "@/lib/promptpay";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session] = await Promise.all([getData(), getSession()]);

  const deal = data.deals.find((d) => d.id === id);
  if (!deal) notFound();

  // Broker can only view own deals
  const isBroker = session?.type === "broker";
  if (isBroker && deal.agentId !== session?.agentId) notFound();

  const customer = data.customers.find((c) => c.id === deal.customerId);
  const agent = deal.agentId ? data.agents.find((a) => a.id === deal.agentId) : null;
  const payments = data.payments.filter((p) => p.dealId === id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const payouts = data.payouts.filter((p) => p.dealId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const notes = data.notes.filter((n) => n.dealId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const events = data.events.filter((e) => e.dealId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const quotation = data.quotations.find((q) => q.dealId === id);

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending");
  const paidPayouts = payouts.filter((p) => p.status === "paid");

  // QR codes for pending payouts (server-side)
  const pendingPayoutQRs = agent?.promptpay
    ? await Promise.all(
        pendingPayouts.map(async (p) => ({
          id: p.id,
          amount: p.amount,
          note: p.note,
          dataUrl: await QRCode.toDataURL(
            promptPayQRString(agent.promptpay!.replace(/\D/g, ""), p.amount),
            { width: 480, margin: 3, color: { dark: "#000000", light: "#ffffff" } }
          ).catch(() => ""),
        }))
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href="/deals" className="hover:text-accent">ดีล</Link>
            <span>/</span>
            <span>{deal.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(deal.status)}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
            <span className="text-xs text-muted">{PROJECT_TYPE_LABELS[deal.projectType]}</span>
          </div>
        </div>
        {!isBroker && (
          <div className="flex gap-2 shrink-0">
            <Link href={`/deals/${id}/edit`} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 transition-colors">
              แก้ไข
            </Link>
            <DeleteButton
              action={deleteDeal}
              id={id}
              confirmTitle="ลบดีล"
              confirmMessage="ดีลนี้จะถูกลบพร้อมข้อมูลการรับเงินและค่าคอมทั้งหมด ไม่สามารถกู้คืนได้"
              label="ลบดีล"
              redirectTo="/deals"
            />
          </div>
        )}
      </div>

      {/* วันครบกำหนดรับเงินงวดถัดไป */}
      {deal.nextPaymentDue && !["completed", "cancelled"].includes(deal.status) && (() => {
        const overdue = deal.nextPaymentDue < todayISO();
        return (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm -mx-4 ${
              overdue ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            }`}
          >
            <span className="text-lg">{overdue ? "⚠️" : "📅"}</span>
            <div className="flex-1">
              <p className={`font-semibold ${overdue ? "text-red-700" : "text-amber-800"}`}>
                {overdue ? "เลยกำหนดรับเงินแล้ว" : "ครบกำหนดรับเงินงวดถัดไป"}
              </p>
              <p className={`text-xs mt-0.5 ${overdue ? "text-red-600" : "text-amber-600"}`}>
                {formatDate(deal.nextPaymentDue)}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Deal info */}
      <div className="bg-surface border border-border rounded-xl divide-y divide-border -mx-4">
        <div className="px-4 py-3 font-semibold text-sm">ข้อมูลดีล</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { label: "ลูกค้า", value: customer?.name ?? "—" },
            { label: "นายหน้า", value: agent?.name ?? "ไม่มี" },
            { label: "ยอดเสนอราคา", value: formatBaht(deal.quotedAmount) },
            { label: "ค่าคอม", value: agent ? `${deal.commissionValue}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 flex flex-col gap-0.5">
              <span className="text-xs text-muted">{label}</span>
              <span className="font-medium text-sm">{value}</span>
            </div>
          ))}
        </div>
        {deal.description && (
          <div className="px-4 py-3 flex flex-col gap-1">
            <span className="text-xs text-muted font-medium">รายละเอียด</span>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{deal.description}</p>
          </div>
        )}
      </div>

      {/* รายการงานจากใบเสนอราคา */}
      {quotation && quotation.items.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden -mx-4">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm">รายการที่ลูกค้าต้องการ</span>
            <Link
              href={`/quotation/${quotation.id}`}
              target="_blank"
              className="text-xs text-accent hover:underline"
            >
              ดูใบเสนอราคา {quotation.number} →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-muted uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">#</th>
                <th className="text-left px-4 py-2 font-medium">รายการ</th>
                <th className="text-center px-4 py-2 font-medium w-16">จำนวน</th>
                <th className="text-right px-4 py-2 font-medium w-28 hidden sm:table-cell">ราคา/หน่วย</th>
                <th className="text-right px-4 py-2 font-medium w-28">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotation.items.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 text-foreground">{item.description}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted">{item.qty}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted hidden sm:table-cell">{formatBaht(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatBaht(item.qty * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-slate-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-xs text-muted hidden sm:table-cell">รวมทั้งสิ้น</td>
                <td colSpan={3} className="px-4 py-3 text-right text-xs text-muted sm:hidden">รวมทั้งสิ้น</td>
                <td className="px-4 py-3 text-right font-bold text-accent tabular-nums">{formatBaht(deal.quotedAmount)}</td>
              </tr>
            </tfoot>
          </table>
          {quotation.notes && (
            <div className="px-4 py-3 border-t border-border text-xs text-muted whitespace-pre-wrap">
              <span className="font-medium text-foreground">หมายเหตุ:</span> {quotation.notes}
            </div>
          )}
        </div>
      )}

      {/* Status update — admin only */}
      {!isBroker && (
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 -mx-4">
          <span className="font-semibold text-sm">เปลี่ยนสถานะ</span>
          <div className="flex flex-wrap gap-2">
            {DEAL_STATUS_ORDER.map((s) => {
              const isCurrent = deal.status === s;
              // ถ้า deal ถูกยกเลิกแล้ว ปุ่มอื่นต้องใส่ PIN ก่อน
              if (deal.status === "cancelled" && !isCurrent) {
                return <CancelUnlockButton key={s} id={id} status={s} label={DEAL_STATUS_LABELS[s]} />;
              }
              return (
                <form key={s} action={changeDealStatus}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={isCurrent}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCurrent ? "bg-accent text-white border-accent" : "border-border hover:bg-slate-50"
                    }`}
                  >
                    {DEAL_STATUS_LABELS[s]}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}

      {/* Payouts summary */}
      {agent && payouts.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden -mx-4">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm">ค่าคอม — {agent.name}</span>
              <span className="text-xs text-muted ml-2">({deal.commissionValue}% ต่องวด)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {paidPayouts.length > 0 && (
                <span className="text-green-700 font-medium">จ่ายแล้ว {formatBaht(paidPayouts.reduce((s, p) => s + p.amount, 0))}</span>
              )}
              {pendingPayouts.length > 0 && (
                <span className="text-amber-700 font-medium">ค้าง {formatBaht(pendingPayouts.reduce((s, p) => s + p.amount, 0))}</span>
              )}
            </div>
          </div>
          {/* Pending payouts with QR codes */}
          {pendingPayoutQRs.length > 0 && (
            <div className="divide-y divide-border">
              {pendingPayoutQRs.map((qr) => (
                <div key={qr.id} className="px-4 py-4 flex items-center gap-4">
                  {qr.dataUrl && (
                    <div className="bg-white border border-border rounded-xl p-2 shadow-sm shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image does not support data: scheme */}
                      <img src={qr.dataUrl} alt="PromptPay QR" className="w-40 h-40" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-muted">{qr.note || `ค่าคอม ${deal.commissionValue}%`}</p>
                    <p className="text-lg font-bold text-indigo-600">{formatBaht(qr.amount)}</p>
                    {agent.promptpay && <p className="text-xs text-muted">{agent.promptpay}</p>}
                  </div>
                  <Badge variant="warning">ค้างจ่าย</Badge>
                </div>
              ))}
            </div>
          )}
          {/* ค่าคอมที่จ่ายแล้ว — พร้อมปุ่มใบเสร็จ */}
          {paidPayouts.length > 0 && (
            <div className="divide-y divide-border border-t border-border">
              {paidPayouts.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-green-700">{formatBaht(p.amount)}</span>
                    <span className="text-xs text-muted">จ่ายเมื่อ {formatDate(p.paidAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {!isBroker && <SlipUpload payoutId={p.id} slipUrl={p.slipUrl} />}
                    {isBroker && p.slipUrl && (
                      <a
                        href={p.slipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-slate-50 transition-colors"
                        title="ดูสลิปโอนเงิน"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.slipUrl} alt="สลิป" className="h-5 w-5 object-cover rounded" />
                        ดูสลิปโอนเงิน
                      </a>
                    )}
                    <Link
                      href={`/receipt/${p.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ใบเสร็จนายหน้า
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!agent.promptpay && pendingPayouts.length > 0 && !isBroker && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-amber-600">
                นายหน้ายังไม่มีเบอร์ PromptPay —{" "}
                <Link href={`/agents/${agent.id}/edit`} className="underline hover:text-amber-800">เพิ่มเบอร์</Link>
              </p>
            </div>
          )}

          {/* ปุ่มเปลี่ยนสถานะ "จ่ายค่านายหน้าแล้ว" — โผล่เมื่อจ่ายค่าคอมครบทุกรายการ */}
          {!isBroker && pendingPayouts.length === 0 && paidPayouts.length > 0 && deal.status === "first_payment" && payments.length === 1 && (
            <div className="px-4 py-3 border-t border-green-200 bg-green-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-700 text-sm font-medium">✓ จ่ายค่าคอมครบทุกรายการแล้ว</span>
              </div>
              <ActionButton
                action={changeDealStatus}
                fields={{ id, status: "commission_paid" }}
                label="เปลี่ยนเป็น จ่ายค่านายหน้าแล้ว"
                pendingLabel="กำลังบันทึก…"
                className="text-sm px-4 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              />
            </div>
          )}

          {!isBroker && (
            <div className="px-4 py-2 border-t border-border">
              <Link href="/payouts" className="text-xs text-accent hover:underline">จัดการค่าคอมทั้งหมด →</Link>
            </div>
          )}
        </div>
      )}

      {/* Payments */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden -mx-4">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <span className="font-semibold text-sm">การรับเงิน</span>
          <div className="flex items-center gap-3">
            {!isBroker && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/invoice/${id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ใบแจ้งหนี้
                </Link>
                {payments.length > 0 && (
                  <Link
                    href={`/customer-receipt/${id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ใบเสร็จลูกค้า
                  </Link>
                )}
              </div>
            )}
            <span className="text-sm text-muted">รวม {formatBaht(totalReceived)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">วันที่</th>
                <th className="text-right px-4 py-2 font-medium">จำนวน</th>
                <th className="text-center px-4 py-2 font-medium hidden sm:table-cell">ก้อนแรก</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">หมายเหตุ</th>
                {!isBroker && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.filter((p) => !isBroker || p.isFirstPayment).map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">{formatDate(payment.paidAt)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatBaht(payment.amount)}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {payment.isFirstPayment ? <span className="text-green-600 text-xs font-medium">✓ ก้อนแรก</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{payment.note || "—"}</td>
                  {!isBroker && (
                    <td className="px-4 py-3 text-right">
                      <DeleteDealButton
                        action={deletePayment}
                        id={payment.id}
                        dealId={id}
                        confirmTitle="ลบรายการรับเงิน"
                        confirmMessage="ต้องการลบรายการรับเงินนี้ออกจากระบบ?"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isBroker && (
          <CollapsiblePaymentForm
            dealId={id}
            dealAmount={deal.quotedAmount}
            existingPaymentsCount={payments.length}
            paidTotal={totalReceived}
            plannedPhases={payments.find((p) => p.isFirstPayment)?.plannedPhases}
            commission={agent ? {
              pct: deal.commissionValue,
              agentPromptpay: agent.promptpay,
              agentName: agent.name,
            } : undefined}
          />
        )}
      </div>

      {/* Timeline */}
      {events.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden -mx-4">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Timeline</span>
          </div>
          <div className="px-4 py-4">
            <ol className="relative border-l border-slate-200 flex flex-col gap-0">
              {events.map((ev) => (
                <li key={ev.id} className="ml-4 pb-5 last:pb-0">
                  <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white bg-slate-300" />
                  <p className="text-xs text-muted">{new Date(ev.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    <span className="text-xs text-muted mr-1.5">[{EVENT_TYPE_LABELS[ev.type]}]</span>
                    {ev.note}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Notes / Activity Log */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden -mx-4">
        <div className="px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">โน้ต</span>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <NotesList notes={notes} dealId={id} isBroker={isBroker} />
          <NoteForm dealId={id} />
        </div>
      </div>
    </div>
  );
}
