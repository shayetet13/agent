import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DEAL_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (session?.type !== "admin") redirect("/login");

  const data = await getData();

  const customerMap = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));

  const header = ["ชื่องาน", "ประเภท", "ลูกค้า", "นายหน้า", "ยอดเสนอ (บาท)", "สถานะ", "วันที่สร้าง"];
  const rows = [...data.deals]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((d) => [
      d.title,
      PROJECT_TYPE_LABELS[d.projectType],
      customerMap[d.customerId] ?? "",
      d.agentId ? (agentMap[d.agentId] ?? "") : "",
      d.quotedAmount.toFixed(2),
      DEAL_STATUS_LABELS[d.status],
      d.createdAt.slice(0, 10),
    ]);

  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const bom = "﻿";
  const year = new Date().getFullYear();

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="deals-${year}.csv"`,
    },
  });
}
