import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht, formatDate } from "@/lib/format";
import { DEAL_STATUS_LABELS, statusVariant } from "@/lib/types";
import { Badge } from "@/components/ui";
import { markPayoutPaid, markPayoutPending } from "@/actions/payouts";
import { promptPayQRString } from "@/lib/promptpay";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session] = await Promise.all([getData(), getSession()]);

  // Broker can only view own profile
  const isBroker = session?.type === "broker";
  if (isBroker && id !== session?.agentId) {
    if (session?.agentId) redirect(`/agents/${session.agentId}`);
    else redirect("/");
  }

  const agent = data.agents.find((a) => a.id === id);
  if (!agent) notFound();

  const deals = data.deals.filter((d) => d.agentId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const payouts = data.payouts.filter((p) => p.agentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const qrDataUrl = agent.promptpay
    ? await QRCode.toDataURL(promptPayQRString(agent.promptpay.replace(/\D/g, "")), { width: 160, margin: 2 }).catch(() => "")
    : "";

  const totalCommission = payouts.reduce((s, p) => s + p.amount, 0);
  const pendingCommission = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const completedDeals = deals.filter((d) => d.status === "completed").length;

  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const dealTitleMap = Object.fromEntries(deals.map((d) => [d.id, d.title]));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-1">
            <Link href="/agents" className="hover:text-accent">นายหน้า</Link>
            <span>/</span>
            <span>{agent.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
        </div>
        {!isBroker && (
          <Link href={`/agents/${id}/edit`} className="shrink-0 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-slate-50 transition-colors">
            แก้ไข
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ดีลทั้งหมด", value: `${deals.length} ดีล` },
          { label: "ดีลสำเร็จ", value: `${completedDeals} ดีล` },
          { label: "ค่าคอมรวม", value: formatBaht(totalCommission) },
          { label: "ค้างจ่าย", value: formatBaht(pendingCommission) },
        ].map((card) => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">{card.label}</span>
            <span className="text-xl font-bold text-foreground">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Agent info */}
      <div className="bg-surface border border-border rounded-xl divide-y divide-border">
        <div className="px-4 py-3 font-semibold text-sm">ข้อมูลนายหน้า</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { label: "เบอร์โทร", value: agent.phone || "—" },
            { label: "อีเมล", value: agent.email || "—" },
            { label: "LINE ID", value: agent.lineId || "—" },
            { label: "PromptPay", value: agent.promptpay || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 flex flex-col gap-0.5">
              <span className="text-xs text-muted">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
        {agent.lineQrUrl && (
          <div className="px-4 py-3 border-t border-border flex items-center gap-4">
            <div>
              <span className="text-xs text-muted block mb-1">LINE QR Code (จากการลงทะเบียน)</span>
              <img src={agent.lineQrUrl} alt="LINE QR" className="h-28 w-28 object-contain rounded-lg border border-border bg-white" />
            </div>
          </div>
        )}
        {(agent.bankName || agent.bankAccount) && (
          <div className="px-4 py-3 flex flex-col gap-0.5">
            <span className="text-xs text-muted">บัญชีธนาคาร</span>
            <span className="text-sm font-medium">
              {agent.bankName && <span className="mr-1.5">{agent.bankName}</span>}
              {agent.bankAccount && <span className="font-mono text-muted">{agent.bankAccount}</span>}
            </span>
          </div>
        )}
        {agent.note && (
          <div className="px-4 py-3 text-sm text-muted whitespace-pre-wrap">{agent.note}</div>
        )}
        {/* PromptPay QR Code */}
        {qrDataUrl && (
          <div className="px-4 py-4 flex items-center gap-4">
            <div className="bg-white border border-border rounded-xl p-2 shadow-sm shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image does not support data: scheme */}
              <img src={qrDataUrl} alt="PromptPay QR" className="w-20 h-20" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">PromptPay</p>
              <p className="text-sm text-muted mt-0.5">{agent.promptpay}</p>
              {agent.lineId && (
                <p className="text-xs text-muted mt-2">LINE: <span className="font-medium text-foreground">{agent.lineId}</span></p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Deals */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-semibold text-sm">
          ดีลทั้งหมด ({deals.length})
        </div>
        {deals.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted text-sm">ยังไม่มีดีล</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่องาน</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">ลูกค้า</th>
                <th className="text-right px-4 py-2 font-medium hidden md:table-cell">ยอดเสนอ</th>
                <th className="text-center px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/deals/${deal.id}`} className="font-medium hover:text-accent">{deal.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{customerMap[deal.customerId] ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{formatBaht(deal.quotedAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant(deal.status)}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payouts */}
      {payouts.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">ค่าคอม</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ดีล</th>
                <th className="text-right px-4 py-2 font-medium">ค่าคอม</th>
                <th className="text-center px-4 py-2 font-medium">สถานะ</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">วันที่จ่าย</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-muted">
                    <Link href={`/deals/${payout.dealId}`} className="hover:text-accent">
                      {dealTitleMap[payout.dealId] ?? "—"}
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
                    <td className="px-4 py-3 text-right">
                      {payout.status === "pending" ? (
                        <form action={markPayoutPaid}>
                          <input type="hidden" name="id" value={payout.id} />
                          <button type="submit" className="text-xs px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors">
                            ✓ จ่ายแล้ว
                          </button>
                        </form>
                      ) : (
                        <form action={markPayoutPending}>
                          <input type="hidden" name="id" value={payout.id} />
                          <button type="submit" className="text-xs px-2 py-1 rounded border border-border text-muted hover:bg-slate-50 transition-colors">
                            ยกเลิก
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
