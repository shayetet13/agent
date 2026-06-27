import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (session?.type !== "admin") redirect("/login");

  const data = await getData();

  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));
  const dealMap = Object.fromEntries(data.deals.map((d) => [d.id, d.title]));

  const header = ["นายหน้า", "ดีล", "ค่าคอม (บาท)", "สถานะ", "วันที่จ่าย"];
  const rows = data.payouts.map((p) => [
    agentMap[p.agentId] ?? p.agentId,
    dealMap[p.dealId] ?? p.dealId,
    p.amount.toFixed(2),
    p.status === "paid" ? "จ่ายแล้ว" : "ค้างจ่าย",
    p.paidAt ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  // BOM (EF BB BF) เพื่อให้ Excel เปิด UTF-8 ได้ถูกต้อง
  const bom = "﻿";
  const year = new Date().getFullYear();

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payouts-${year}.csv"`,
    },
  });
}
