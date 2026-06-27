import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatBaht, formatDate } from "@/lib/format";
import { receiptNo } from "@/lib/receipt";
import { DEAL_STATUS_LABELS, statusVariant } from "@/lib/types";
import { Badge } from "@/components/ui";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">ค้นหา</h1>
        <p className="text-muted text-sm">พิมพ์คำค้นหาในช่องด้านบนเพื่อค้นหาดีล ลูกค้า นายหน้า หรือเลขที่ใบเสร็จ (เช่น RC-2026-001)</p>
      </div>
    );
  }

  const data = await getData();
  const lower = query.toLowerCase();

  const deals = data.deals.filter(
    (d) => d.title.toLowerCase().includes(lower) || d.description.toLowerCase().includes(lower)
  );
  const customers = data.customers.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.company.toLowerCase().includes(lower) ||
      c.phone.includes(lower) ||
      c.email.toLowerCase().includes(lower)
  );
  const agents = data.agents.filter(
    (a) =>
      a.name.toLowerCase().includes(lower) ||
      a.phone.includes(lower) ||
      a.email.toLowerCase().includes(lower)
  );

  // ค้นหาเลขที่ใบเสร็จ (จับคู่กับ payout ที่จ่ายแล้ว)
  const receipts = data.payouts
    .filter((p) => p.status === "paid")
    .map((p) => ({ payout: p, no: p.receiptNumber ?? receiptNo(p.id, p.paidAt) }))
    .filter((r) => r.no.toLowerCase().includes(lower));

  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));
  const dealMap = Object.fromEntries(data.deals.map((d) => [d.id, d.title]));
  const total = deals.length + customers.length + agents.length + receipts.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">ค้นหา &ldquo;{query}&rdquo;</h1>
        <p className="text-sm text-muted mt-1">พบ {total} รายการ</p>
      </div>

      {total === 0 && (
        <div className="bg-surface border border-border rounded-xl px-4 py-12 text-center text-muted text-sm">
          ไม่พบรายการที่ตรงกับ &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Receipts */}
      {receipts.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">
            ใบเสร็จรับเงิน ({receipts.length})
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {receipts.map(({ payout, no }) => (
                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/receipt/${payout.id}`} target="_blank" className="font-medium text-indigo-700 hover:underline tabular-nums">
                      {no}
                    </Link>
                    <div className="text-xs text-muted mt-0.5">
                      {agentMap[payout.agentId] ?? "—"} · {dealMap[payout.dealId] ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted hidden sm:table-cell">
                    {formatBaht(payout.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{formatDate(payout.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">
            ดีล ({deals.length})
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/deals/${deal.id}`} className="font-medium hover:text-accent">{deal.title}</Link>
                    <div className="text-xs text-muted mt-0.5">{customerMap[deal.customerId] ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted hidden sm:table-cell">
                    {formatBaht(deal.quotedAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusVariant(deal.status)}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers */}
      {customers.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">
            ลูกค้า ({customers.length})
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${customer.id}/edit`} className="font-medium hover:text-accent">{customer.name}</Link>
                    {customer.company && <div className="text-xs text-muted mt-0.5">{customer.company}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{customer.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agents */}
      {agents.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">
            นายหน้า ({agents.length})
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/agents/${agent.id}`} className="font-medium hover:text-accent">{agent.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{agent.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{agent.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
