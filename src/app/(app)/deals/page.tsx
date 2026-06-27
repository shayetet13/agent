import Link from "next/link";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht } from "@/lib/format";
import { DEAL_STATUS_LABELS, DEAL_STATUS_ORDER, statusVariant } from "@/lib/types";
import { Badge } from "@/components/ui";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, data, session] = await Promise.all([searchParams, getData(), getSession()]);
  const isBroker = session?.type === "broker";
  const brokerId = session?.agentId ?? null;

  let deals = [...data.deals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // Broker sees only own deals
  if (isBroker) deals = deals.filter((d) => d.agentId === brokerId);

  if (sp.customerId) deals = deals.filter((d) => d.customerId === sp.customerId);
  if (sp.agentId) deals = deals.filter((d) => d.agentId === sp.agentId);
  if (sp.status) deals = deals.filter((d) => d.status === sp.status);

  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{isBroker ? "ดีลของฉัน" : "ดีล"} ({deals.length})</h1>
        {!isBroker && (
          <div className="flex items-center gap-2">
            <a
              href="/api/export/deals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              ↓ Export CSV
            </a>
            <Link href="/deals/new" className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              + สร้างดีลใหม่
            </Link>
          </div>
        )}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <Link href="/deals" className={`text-xs px-3 py-1 rounded-full border transition-colors ${!sp.status ? "bg-accent text-white border-accent" : "border-border hover:bg-slate-50"}`}>
          ทั้งหมด
        </Link>
        {DEAL_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/deals?status=${s}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${sp.status === s ? "bg-accent text-white border-accent" : "border-border hover:bg-slate-50"}`}
          >
            {DEAL_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden -mx-4">
        {deals.length === 0 ? (
          <p className="px-4 py-12 text-center text-muted text-sm">
            {isBroker
              ? "ยังไม่มีดีลที่คุณรับผิดชอบ"
              : <><span>ไม่มีดีล — </span><Link href="/deals/new" className="text-accent hover:underline">สร้างดีลใหม่</Link></>
            }
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่องาน</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">ลูกค้า</th>
                {!isBroker && <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">นายหน้า</th>}
                <th className="text-right px-4 py-2 font-medium hidden md:table-cell">ยอดเสนอ</th>
                <th className="text-center px-4 py-2 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/deals/${deal.id}`} className="font-medium hover:text-accent">{deal.title}</Link>
                    <div className="text-xs text-muted sm:hidden">{customerMap[deal.customerId] ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{customerMap[deal.customerId] ?? "—"}</td>
                  {!isBroker && <td className="px-4 py-3 text-muted hidden lg:table-cell">{deal.agentId ? agentMap[deal.agentId] ?? "—" : "—"}</td>}
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
    </div>
  );
}
