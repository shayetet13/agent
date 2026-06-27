import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht, formatDate } from "@/lib/format";
import { DEAL_STATUS_LABELS, DEAL_STATUS_ORDER, statusVariant, type DealStatus } from "@/lib/types";
import { Badge } from "@/components/ui";
import { BarChart } from "@/components/RevenueChart";
import { PeriodNav } from "@/components/PeriodNav";

// ── Period helpers ──────────────────────────────────────────────────────────

type View = "day" | "month" | "year";

function currentDefault(view: View): string {
  const now = new Date();
  if (view === "day") return now.toISOString().slice(0, 10);
  if (view === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return String(now.getFullYear());
}

function getRange(view: View, date: string): { start: string; end: string } {
  if (view === "day") return { start: date, end: date };
  if (view === "month") {
    const [y, m] = date.split("-").map(Number);
    const last = new Date(y, m, 0).getDate();
    return { start: `${date}-01`, end: `${date}-${String(last).padStart(2, "0")}` };
  }
  return { start: `${date}-01-01`, end: `${date}-12-31` };
}

function inRange(isoDate: string, start: string, end: string): boolean {
  const d = isoDate.slice(0, 10);
  return d >= start && d <= end;
}

function periodLabel(view: View, date: string): string {
  if (view === "day") {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  }
  if (view === "month") {
    const [y, m] = date.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  }
  return `ปี ${Number(date) + 543}`;
}

function buildRevenueChart(
  view: View,
  date: string,
  payments: { paidAt: string; amount: number }[],
): { label: string; value: number }[] {
  if (view === "year") {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return months.map((label, i) => {
      const key = `${date}-${String(i + 1).padStart(2, "0")}`;
      const value = payments.filter((p) => p.paidAt.startsWith(key)).reduce((s, p) => s + p.amount, 0);
      return { label, value };
    });
  }
  if (view === "month") {
    const [y, m] = date.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const key = `${date}-${String(day).padStart(2, "0")}`;
      const value = payments.filter((p) => p.paidAt === key).reduce((s, p) => s + p.amount, 0);
      return {
        label: day % 5 === 0 || day === 1 || day === days ? String(day) : "",
        value,
      };
    });
  }
  // day view — hourly breakdown (group by hour from createdAt is unreliable; just return total bar)
  const total = payments.reduce((s, p) => s + p.amount, 0);
  return [{ label: "รวม", value: total }];
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, session, data] = await Promise.all([searchParams, getSession(), getData()]);
  if (session?.type === "broker") redirect("/");

  const view = (["day", "month", "year"].includes(sp.view ?? "") ? sp.view : "month") as View;
  const date = sp.date || currentDefault(view);
  const { start, end } = getRange(view, date);
  const label = periodLabel(view, date);

  // ── Filtered collections ──
  const paymentsInPeriod = data.payments.filter((p) => inRange(p.paidAt, start, end));
  const dealsCreated = data.deals.filter((d) => inRange(d.createdAt, start, end));
  const dealsCompleted = data.deals.filter(
    (d) => d.status === "completed" && inRange(d.updatedAt, start, end),
  );
  const payoutsPaidInPeriod = data.payouts.filter(
    (p) => p.status === "paid" && p.paidAt && inRange(p.paidAt, start, end),
  );
  const newCustomers = data.customers.filter((c) => inRange(c.createdAt, start, end));

  // ── KPIs ──
  const totalRevenue = paymentsInPeriod.reduce((s, p) => s + p.amount, 0);
  const commissionPaid = payoutsPaidInPeriod.reduce((s, p) => s + p.amount, 0);
  const pendingCommission = data.payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const totalQuoteInProgress = data.deals
    .filter((d) => !["completed", "cancelled"].includes(d.status))
    .reduce((s, d) => s + d.quotedAmount, 0);

  // ── System-wide totals (always) ──
  const sysRevenue = data.payments.reduce((s, p) => s + p.amount, 0);
  const sysDeals = data.deals.length;
  const sysAgents = data.agents.length;
  const sysCustomers = data.customers.length;

  // ── Deal status breakdown (all-time) ──
  const statusCount = DEAL_STATUS_ORDER.reduce<Record<DealStatus, number>>(
    (acc, s) => ({ ...acc, [s]: data.deals.filter((d) => d.status === s).length }),
    {} as Record<DealStatus, number>,
  );
  const maxStatusCount = Math.max(...Object.values(statusCount), 1);

  // ── Revenue chart ──
  const revenueChart = buildRevenueChart(view, date, paymentsInPeriod);

  // ── Agent performance in period ──
  const agentPerf = data.agents.map((agent) => {
    const agentDeals = dealsCreated.filter((d) => d.agentId === agent.id);
    const agentPayments = paymentsInPeriod.filter((p) => {
      const deal = data.deals.find((d) => d.id === p.dealId);
      return deal?.agentId === agent.id;
    });
    const agentPayouts = payoutsPaidInPeriod.filter((p) => p.agentId === agent.id);
    const pendingPay = data.payouts
      .filter((p) => p.agentId === agent.id && p.status === "pending")
      .reduce((s, p) => s + p.amount, 0);
    return {
      agent,
      dealsCount: agentDeals.length,
      revenue: agentPayments.reduce((s, p) => s + p.amount, 0),
      commissionPaid: agentPayouts.reduce((s, p) => s + p.amount, 0),
      pending: pendingPay,
    };
  }).filter((a) => a.dealsCount > 0 || a.revenue > 0 || a.pending > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // ── Maps ──
  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));

  // Deals updated in period (incl. created)
  const dealsInPeriod = data.deals
    .filter((d) => inRange(d.createdAt, start, end) || inRange(d.updatedAt, start, end))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);

  const recentPayments = [...paymentsInPeriod].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted mt-0.5">ข้อมูลทั้งหมดในระบบ</p>
        </div>
        <PeriodNav view={view} date={date} label={label} />
      </div>

      {/* System Totals — always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "รายได้รวมทั้งหมด", value: formatBaht(sysRevenue), sub: "ตลอดทุกช่วงเวลา" },
          { label: "ดีลทั้งหมด", value: `${sysDeals} ดีล`, sub: `${data.deals.filter((d) => d.status === "completed").length} สำเร็จ` },
          { label: "นายหน้า", value: `${sysAgents} คน`, sub: "ลงทะเบียนแล้ว" },
          { label: "ลูกค้า", value: `${sysCustomers} ราย`, sub: "ในระบบ" },
        ].map((c) => (
          <div key={c.label} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
            <p className="text-xs text-muted font-medium">{c.label}</p>
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Period KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{label}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "ยอดรับเงิน",    value: formatBaht(totalRevenue),           color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200",   href: "#section-payments" },
            { label: "ดีลใหม่",       value: `${dealsCreated.length} ดีล`,       color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",       href: "#section-deals" },
            { label: "ดีลสำเร็จ",    value: `${dealsCompleted.length} ดีล`,     color: "text-green-600",  bg: "bg-green-50 border-green-200",     href: "/deals?status=completed" },
            { label: "ลูกค้าใหม่",   value: `${newCustomers.length} ราย`,       color: "text-violet-600", bg: "bg-violet-50 border-violet-200",   href: "#section-customers" },
            { label: "ค่าคอมจ่าย",   value: formatBaht(commissionPaid),         color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200", href: "/payouts" },
            { label: "ค่าคอมค้างจ่าย",value: formatBaht(pendingCommission),     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",     href: "/payouts" },
          ].map((c) => (
            <Link key={c.label} href={c.href} className={`border rounded-xl p-3 flex flex-col gap-0.5 hover:opacity-80 transition-opacity ${c.bg}`}>
              <p className="text-xs font-medium text-muted">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        {view !== "day" && revenueChart.some((d) => d.value > 0) ? (
          <BarChart data={revenueChart} title={`รายได้ — ${label}`} color="#6366f1" />
        ) : view === "day" ? (
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
            <span className="font-semibold text-sm">รายได้ — {label}</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-indigo-600">{formatBaht(totalRevenue)}</span>
              <span className="text-sm text-muted">({paymentsInPeriod.length} รายการ)</span>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-center text-muted text-sm">
            ไม่มีรายการรับเงินในช่วงนี้
          </div>
        )}

        {/* Deal Status Breakdown */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <span className="font-semibold text-sm">สถานะดีล (ทั้งหมด {sysDeals} ดีล)</span>
          <div className="flex flex-col gap-2">
            {DEAL_STATUS_ORDER.map((s) => {
              const count = statusCount[s];
              const pct = maxStatusCount ? (count / maxStatusCount) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <Link
                    href={`/deals?status=${s}`}
                    className="w-24 text-muted hover:text-accent shrink-0 truncate"
                  >
                    {DEAL_STATUS_LABELS[s]}
                  </Link>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          s === "completed" ? "#10b981" :
                          s === "cancelled" ? "#ef4444" :
                          s === "first_payment" ? "#f59e0b" :
                          "#6366f1",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium text-foreground shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted pt-1">
            มูลค่างานในมือ: <span className="font-semibold text-foreground">{formatBaht(totalQuoteInProgress)}</span>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      {agentPerf.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">ผลงานนายหน้า — {label}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">นายหน้า</th>
                <th className="text-center px-4 py-2 font-medium hidden sm:table-cell">ดีลใหม่</th>
                <th className="text-right px-4 py-2 font-medium">รายได้ที่ดูแล</th>
                <th className="text-right px-4 py-2 font-medium hidden md:table-cell">ค่าคอมจ่าย</th>
                <th className="text-right px-4 py-2 font-medium">ค้างจ่าย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agentPerf.map(({ agent, dealsCount, revenue, commissionPaid: cp, pending }) => (
                <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/agents/${agent.id}`} className="font-medium hover:text-accent">{agent.name}</Link>
                    {agent.phone && <div className="text-xs text-muted">{agent.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{dealsCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBaht(revenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell text-green-700">{formatBaht(cp)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-700">{formatBaht(pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments in period */}
      {recentPayments.length > 0 && (
        <div id="section-payments" className="bg-surface border border-border rounded-xl overflow-hidden scroll-mt-4">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">รายการรับเงิน ({recentPayments.length} รายการ)</h2>
            <span className="text-sm text-muted">รวม {formatBaht(totalRevenue)}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">วันที่</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">ดีล</th>
                <th className="text-right px-4 py-2 font-medium">จำนวน</th>
                <th className="text-center px-4 py-2 font-medium hidden md:table-cell">ก้อนแรก</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentPayments.map((p) => {
                const deal = data.deals.find((d) => d.id === p.dealId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-muted">{formatDate(p.paidAt)}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {deal ? (
                        <Link href={`/deals/${deal.id}`} className="hover:text-accent">{deal.title}</Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatBaht(p.amount)}</td>
                    <td className="px-4 py-2.5 text-center hidden md:table-cell">
                      {p.isFirstPayment ? <span className="text-xs text-green-600 font-medium">✓</span> : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted hidden lg:table-cell text-xs">{p.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deals in period */}
      {dealsInPeriod.length > 0 && (
        <div id="section-deals" className="bg-surface border border-border rounded-xl overflow-hidden scroll-mt-4">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">ดีลในช่วงนี้ ({dealsInPeriod.length})</h2>
            <Link href="/deals" className="text-xs text-accent hover:underline">ดูทั้งหมด →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่องาน</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">ลูกค้า</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">นายหน้า</th>
                <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">ยอด</th>
                <th className="text-center px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dealsInPeriod.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/deals/${deal.id}`} className="font-medium hover:text-accent">{deal.title}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{customerMap[deal.customerId] ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted hidden md:table-cell">{deal.agentId ? (agentMap[deal.agentId] ?? "—") : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums hidden sm:table-cell">{formatBaht(deal.quotedAmount)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant={statusVariant(deal.status)}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Customers */}
      {newCustomers.length > 0 && (
        <div id="section-customers" className="bg-surface border border-border rounded-xl overflow-hidden scroll-mt-4">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">ลูกค้าใหม่ ({newCustomers.length} ราย)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">บริษัท</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">เบอร์โทร</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">แหล่งที่มา</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">วันที่เพิ่ม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {newCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`/customers/${c.id}/edit`} className="hover:text-accent">{c.name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{c.company || "—"}</td>
                  <td className="px-4 py-2.5 text-muted hidden md:table-cell">{c.phone || "—"}</td>
                  <td className="px-4 py-2.5 text-muted hidden lg:table-cell">{c.source || "—"}</td>
                  <td className="px-4 py-2.5 text-muted hidden sm:table-cell text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {paymentsInPeriod.length === 0 && dealsCreated.length === 0 && newCustomers.length === 0 && (
        <div className="bg-surface border border-border rounded-xl px-4 py-12 text-center text-muted text-sm">
          ไม่มีกิจกรรมใน{view === "day" ? "วันนี้" : view === "month" ? "เดือนนี้" : "ปีนี้"}
        </div>
      )}
    </div>
  );
}
