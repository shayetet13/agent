import Link from "next/link";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht, formatDate, todayISO } from "@/lib/format";
import { DEAL_STATUS_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, statusVariant } from "@/lib/types";
import { Badge } from "@/components/ui";
import { BarChart } from "@/components/RevenueChart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const [data, session, sp] = await Promise.all([getData(), getSession(), searchParams]);
  const isBroker = session?.type === "broker";
  const brokerId = session?.agentId ?? null;
  const justSubmitted = sp.submitted === "1";

  // Data filtering by session
  const deals = isBroker ? data.deals.filter((d) => d.agentId === brokerId) : data.deals;
  const dealIds = new Set(deals.map((d) => d.id));
  const payments = isBroker ? data.payments.filter((p) => dealIds.has(p.dealId)) : data.payments;
  const payouts = isBroker ? data.payouts.filter((p) => p.agentId === brokerId) : data.payouts;

  const totalDeals = deals.length;
  const activeDeals = deals.filter((d) => !["completed", "cancelled"].includes(d.status)).length;
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const pendingPayouts = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const paidPayouts = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  // Broker's submitted leads
  const myLeads = isBroker
    ? [...data.leads].filter((l) => l.agentId === brokerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];
  const readLeads = myLeads.filter((l) => l.status === "read");
  const contactedLeads = myLeads.filter((l) => l.status === "contacted");
  const convertedLeads = myLeads.filter((l) => l.status === "converted");

  // Broker's quotations
  const myQuotations = isBroker
    ? data.quotations.filter((q) => q.agentId === brokerId)
    : [];
  const draftQuotations = myQuotations.filter((q) => q.status === "draft").length;

  const recentDeals = [...deals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));

  // ดีลที่เลยกำหนดรับเงิน (admin เท่านั้น)
  const today = todayISO();
  const overdueDeals = isBroker
    ? []
    : data.deals
        .filter((d) => d.nextPaymentDue && d.nextPaymentDue < today && !["completed", "cancelled"].includes(d.status))
        .sort((a, b) => (a.nextPaymentDue! < b.nextPaymentDue! ? -1 : 1));

  // นายหน้าที่ลงทะเบียนตัวเองและรอการอนุมัติจาก admin
  const pendingAgents = isBroker
    ? []
    : data.agents.filter((a) => a.reviewStatus === "pending");

  // Charts
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("th-TH", { month: "short" });
    const value = payments.filter((p) => p.paidAt.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    return { label, value };
  });

  const agentCommission = isBroker
    ? []
    : data.agents
        .map((a) => ({
          label: a.name.split(" ")[0],
          value: data.payouts.filter((p) => p.agentId === a.id).reduce((s, p) => s + p.amount, 0),
        }))
        .filter((a) => a.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">
        {isBroker ? "งานของฉัน" : "ภาพรวม"}
      </h1>

      {/* Success banner after lead submission */}
      {justSubmitted && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl text-white text-sm font-medium shadow-md"
          style={{ background: "linear-gradient(135deg, #16181d 0%, #ff6a1a 60%, #ff2e63 100%)" }}
        >
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold">ส่งข้อมูลลูกค้าสำเร็จ!</p>
            <p className="opacity-80 text-xs mt-0.5">ทีมงานจะติดต่อกลับโดยเร็ว เมื่อ admin อ่านข้อมูลแล้วจะมีการแจ้งเตือนที่นี่</p>
          </div>
        </div>
      )}

      {/* Status notifications for broker */}
      {isBroker && (contactedLeads.length > 0 || convertedLeads.length > 0) && (
        <div className="flex flex-col gap-2">
          {convertedLeads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm bg-green-50 border-green-200">
              <span className="text-green-600 text-lg">🎉</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800">Lead แปลงเป็นดีลแล้ว!</p>
                <p className="text-green-700 text-xs mt-0.5">
                  ลูกค้า: {lead.customerName || "ไม่ระบุ"}{lead.customerCompany ? ` · ${lead.customerCompany}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-green-600 opacity-70">
                {new Date(lead.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
          {contactedLeads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm bg-indigo-50 border-indigo-200">
              <span className="text-indigo-500 text-lg">📞</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-indigo-800">Admin ติดต่อลูกค้าแล้ว</p>
                <p className="text-indigo-700 text-xs mt-0.5">
                  ลูกค้า: {lead.customerName || "ไม่ระบุ"}{lead.customerCompany ? ` · ${lead.customerCompany}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-indigo-500 opacity-70">
                {lead.contactedAt ? new Date(lead.contactedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      {isBroker ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* row 1 — ดีล */}
          <Link href="/deals" className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors flex flex-col gap-1">
            <span className="text-xs text-muted font-medium">ดีลทั้งหมด</span>
            <span className="text-2xl font-bold text-foreground">{totalDeals} ดีล</span>
            <span className="text-[11px] text-muted mt-0.5">กำลังดำเนินงาน {activeDeals} ดีล</span>
          </Link>
          <Link href="/payouts" className="bg-green-50 border border-green-200 rounded-xl p-4 hover:border-green-400 transition-colors flex flex-col gap-1">
            <span className="text-xs text-green-700 font-medium">ค่าคอมรับแล้ว</span>
            <span className="text-2xl font-bold text-green-800">{formatBaht(paidPayouts)}</span>
            <span className="text-[11px] text-green-600 mt-0.5">ยอดสะสม</span>
          </Link>
          <Link href="/payouts" className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-400 transition-colors flex flex-col gap-1">
            <span className="text-xs text-amber-700 font-medium">ค่าคอมค้างรับ</span>
            <span className="text-2xl font-bold text-amber-800">{formatBaht(pendingPayouts)}</span>
            <span className="text-[11px] text-amber-600 mt-0.5">รอรับจากโปรเจกต์</span>
          </Link>
          {/* row 2 — ลีด + quotation + profile */}
          <Link href="/leads/my" className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:border-indigo-400 transition-colors flex flex-col gap-1">
            <span className="text-xs text-indigo-700 font-medium">ลีดที่ส่งไปแล้ว</span>
            <span className="text-2xl font-bold text-indigo-800">{myLeads.length} ราย</span>
            <span className="text-[11px] text-indigo-500 mt-0.5">
              {myLeads.length === 0 ? "ยังไม่มีลีด" : `สำเร็จ ${convertedLeads.length} · รออยู่ ${readLeads.length + contactedLeads.length}`}
            </span>
          </Link>
          <Link href="/quotations" className="bg-purple-50 border border-purple-200 rounded-xl p-4 hover:border-purple-400 transition-colors flex flex-col gap-1">
            <span className="text-xs text-purple-700 font-medium">ใบเสนอราคา</span>
            <span className="text-2xl font-bold text-purple-800">{myQuotations.length} รายการ</span>
            <span className="text-[11px] text-purple-500 mt-0.5">
              {myQuotations.length === 0 ? "ยังไม่มีใบเสนอ" : `ร่าง ${draftQuotations} · อนุมัติแล้ว ${myQuotations.length - draftQuotations}`}
            </span>
          </Link>
          {brokerId ? (
            <Link href={`/agents/${brokerId}`} className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors flex flex-col gap-1">
              <span className="text-xs text-muted font-medium">โปรไฟล์ของฉัน</span>
              <span className="text-2xl font-bold text-foreground">{data.agents.find((a) => a.id === brokerId)?.name?.split(" ")[0] ?? "—"}</span>
              <span className="text-[11px] text-muted mt-0.5">ดูข้อมูลและบัญชีธนาคาร</span>
            </Link>
          ) : (
            <Link href="/leads/new" className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors flex flex-col gap-1">
              <span className="text-xs text-muted font-medium">ส่งลีดใหม่</span>
              <span className="text-2xl font-bold text-foreground">+ เพิ่ม</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "ดีลทั้งหมด", value: `${totalDeals} ดีล`, href: "/deals" },
            { label: "ดีลที่ยังเปิดอยู่", value: `${activeDeals} ดีล`, href: "/deals" },
            { label: "ยอดรับเงินรวม", value: formatBaht(totalPayments), href: "/deals" },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="bg-surface border border-border rounded-xl p-4 hover:border-accent transition-colors flex flex-col gap-1"
            >
              <span className="text-xs text-muted font-medium uppercase tracking-wide">{card.label}</span>
              <span className="text-2xl font-bold text-foreground">{card.value}</span>
            </Link>
          ))}
          <Link href="/payouts" className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-400 transition-colors flex flex-col gap-1">
            <span className="text-xs text-amber-700 font-medium uppercase tracking-wide">ค่าคอมค้างจ่าย</span>
            <span className="text-2xl font-bold text-amber-800">{formatBaht(pendingPayouts)}</span>
          </Link>
          <Link href="/payouts" className="bg-green-50 border border-green-200 rounded-xl p-4 hover:border-green-400 transition-colors flex flex-col gap-1">
            <span className="text-xs text-green-700 font-medium uppercase tracking-wide">ค่าคอมจ่ายแล้ว</span>
            <span className="text-2xl font-bold text-green-800">{formatBaht(paidPayouts)}</span>
          </Link>
        </div>
      )}

      {/* Charts (admin only or broker with data) */}
      {(monthlyRevenue.some((m) => m.value > 0) || agentCommission.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {monthlyRevenue.some((m) => m.value > 0) && (
            <BarChart data={monthlyRevenue} title="รายได้ 6 เดือนหลัง" color="#6366f1" />
          )}
          {agentCommission.length > 0 && (
            <BarChart data={agentCommission} title="ค่าคอมต่อนายหน้า" color="#10b981" />
          )}
        </div>
      )}

      {/* Broker: ส่งลีดลูกค้าใหม่ + lead history */}
      {isBroker && (
        <div className="flex flex-col gap-3">
          <Link
            href="/leads/new"
            className="flex items-center gap-3 px-5 py-4 rounded-xl text-white font-semibold text-sm shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #16181d 0%, #ff6a1a 60%, #ff2e63 100%)" }}
          >
            <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <div>
              <p className="font-bold">ส่งข้อมูลลูกค้าใหม่</p>
              <p className="text-xs opacity-70 font-normal mt-0.5">กรอกรายละเอียดลูกค้าที่สนใจใช้บริการ</p>
            </div>
            <svg className="w-4 h-4 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {myLeads.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground text-sm">ลีดที่ส่งไปแล้ว</h2>
                <span className="text-xs text-muted">{myLeads.length} รายการ</span>
              </div>
              <div className="divide-y divide-border">
                {myLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      lead.status === "converted" ? "bg-green-500" :
                      lead.status === "contacted" ? "bg-indigo-400" :
                      lead.status === "rejected" ? "bg-red-400" :
                      lead.status === "read" ? "bg-blue-400" : "bg-orange-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{lead.customerName || "ไม่ระบุชื่อ"}</p>
                      {lead.customerCompany && <p className="text-xs text-muted">{lead.customerCompany}</p>}
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick links — admin only */}
      {!isBroker && (
        <div className="flex flex-wrap gap-3">
          <Link href="/deals/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            + สร้างดีลใหม่
          </Link>
          <Link href="/customers/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-slate-50 transition-colors">
            + เพิ่มลูกค้า
          </Link>
          <Link href="/agents/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-slate-50 transition-colors">
            + เพิ่มนายหน้า
          </Link>
        </div>
      )}

      {/* นายหน้าลงทะเบียนรอเปิดใช้งาน — admin only */}
      {pendingAgents.length > 0 && (
        <Link
          href="/agents"
          className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 hover:bg-amber-100/60 transition-colors"
        >
          <span className="text-xl">🆕</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              มีนายหน้าลงทะเบียนใหม่ {pendingAgents.length} คน รอเปิดใช้งาน
            </p>
            <p className="text-xs text-amber-700 mt-0.5">คลิกเพื่อดูและตั้งค่า username / password</p>
          </div>
          <span className="text-amber-500 shrink-0">→</span>
        </Link>
      )}

      {/* เลยกำหนดรับเงิน — admin only */}
      {!isBroker && overdueDeals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="font-semibold text-red-800 text-sm">เลยกำหนดรับเงิน {overdueDeals.length} ดีล</h2>
          </div>
          <div className="divide-y divide-red-100">
            {overdueDeals.slice(0, 5).map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="px-4 py-3 flex items-center gap-3 text-sm hover:bg-red-100/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{deal.title}</p>
                  <p className="text-xs text-muted">{customerMap[deal.customerId] ?? "—"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-red-700">{formatDate(deal.nextPaymentDue)}</p>
                  <p className="text-[11px] text-red-500">{DEAL_STATUS_LABELS[deal.status]}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent deals */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">ดีลล่าสุด</h2>
          <Link href="/deals" className="text-sm text-accent hover:underline">ดูทั้งหมด →</Link>
        </div>
        {recentDeals.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted text-sm">
            {isBroker ? "ยังไม่มีดีลที่คุณรับผิดชอบ" : <>ยังไม่มีดีล — <Link href="/deals/new" className="text-accent hover:underline">สร้างดีลแรก</Link></>}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่องาน</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">ลูกค้า</th>
                {!isBroker && <th className="text-left px-4 py-2 font-medium hidden md:table-cell">นายหน้า</th>}
                <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">ยอดเสนอ</th>
                <th className="text-center px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/deals/${deal.id}`} className="font-medium text-foreground hover:text-accent">{deal.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{customerMap[deal.customerId] ?? "—"}</td>
                  {!isBroker && <td className="px-4 py-3 text-muted hidden md:table-cell">{deal.agentId ? agentMap[deal.agentId] ?? "—" : "—"}</td>}
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{formatBaht(deal.quotedAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant(deal.status)}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
