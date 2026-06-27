import { NextResponse } from "next/server";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { receiptNo } from "@/lib/receipt";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ deals: [], customers: [], agents: [], receipts: [], total: 0 });
  }

  const data = await getData();
  const lower = q.toLowerCase();
  const isBroker = session.type === "broker";
  const brokerId = session.agentId;

  // Strip formatting for numeric search (฿, commas, spaces)
  const numStr = q.replace(/[,฿\s]/g, "");

  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));
  const dealMap = Object.fromEntries(data.deals.map((d) => [d.id, d.title]));

  const allDeals = isBroker ? data.deals.filter((d) => d.agentId === brokerId) : data.deals;

  // ── Deals ──────────────────────────────────────────────────
  const deals = allDeals
    .filter((d) => {
      const commAmt = Math.round(d.quotedAmount * (d.commissionValue / 100));
      return (
        d.title.toLowerCase().includes(lower) ||
        d.description.toLowerCase().includes(lower) ||
        (customerMap[d.customerId] ?? "").toLowerCase().includes(lower) ||
        (d.agentId ? (agentMap[d.agentId] ?? "") : "").toLowerCase().includes(lower) ||
        (numStr && d.quotedAmount.toString().includes(numStr)) ||
        (numStr && commAmt.toString().includes(numStr))
      );
    })
    .slice(0, 6)
    .map((d) => ({
      id: d.id,
      title: d.title,
      customerName: customerMap[d.customerId] ?? "—",
      status: d.status,
      quotedAmount: d.quotedAmount,
    }));

  // ── Customers (admin only) ─────────────────────────────────
  const customers = isBroker
    ? []
    : data.customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.company.toLowerCase().includes(lower) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(lower)
        )
        .slice(0, 5)
        .map((c) => ({ id: c.id, name: c.name, company: c.company, phone: c.phone }));

  // ── Agents (admin only) ────────────────────────────────────
  const agents = isBroker
    ? []
    : data.agents
        .filter(
          (a) =>
            a.name.toLowerCase().includes(lower) ||
            a.phone.includes(q) ||
            a.email.toLowerCase().includes(lower)
        )
        .slice(0, 4)
        .map((a) => ({ id: a.id, name: a.name, phone: a.phone }));

  // ── Receipts ───────────────────────────────────────────────
  const receipts = data.payouts
    .filter((p) => p.status === "paid" && (!isBroker || p.agentId === brokerId))
    .map((p) => ({ p, no: receiptNo(p.id, p.paidAt) }))
    .filter(
      ({ p, no }) =>
        no.toLowerCase().includes(lower) ||
        (agentMap[p.agentId] ?? "").toLowerCase().includes(lower) ||
        (dealMap[p.dealId] ?? "").toLowerCase().includes(lower) ||
        (numStr && p.amount.toString().includes(numStr))
    )
    .slice(0, 4)
    .map(({ p, no }) => ({
      payoutId: p.id,
      receiptNo: no,
      agentName: agentMap[p.agentId] ?? "—",
      dealTitle: dealMap[p.dealId] ?? "—",
      amount: p.amount,
    }));

  const total = deals.length + customers.length + agents.length + receipts.length;
  return NextResponse.json({ deals, customers, agents, receipts, total });
}
