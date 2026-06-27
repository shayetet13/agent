"use server";

import { revalidateTag } from "next/cache";
import { insert, update, remove, getData, DATA_TAG } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { QuotationItem, QuotationStatus } from "@/lib/types";

function nextQuotationNumber(existing: { number: string }[]): string {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;
  const nums = existing
    .map((q) => q.number)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter(Number.isFinite);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export async function createQuotation(formData: FormData): Promise<{ error: string } | never> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const customerId = formData.get("customerId") as string;
  const agentIdRaw = ((formData.get("agentId") as string | null) ?? "").trim();
  const title = (formData.get("title") as string).trim();
  const taxPercent = Number(formData.get("taxPercent") ?? 0);
  const validDays = Number(formData.get("validDays") ?? 30);
  const notes = (formData.get("notes") as string | null) ?? "";
  const excludeHosting = formData.get("excludeHosting") === "on";

  const itemsRaw = formData.get("items") as string;
  let items: QuotationItem[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "รายการไม่ถูกต้อง" };
  }

  if (!customerId) return { error: "กรุณาเลือกลูกค้า" };
  if (!title)      return { error: "กรุณาใส่ชื่อโปรเจค" };
  if (items.length === 0) return { error: "กรุณาเพิ่มอย่างน้อย 1 รายการ" };

  const data = await getData();
  // นายหน้าเลือกได้ (optional) — ถ้าระบุมาต้องมีจริง ไม่งั้น = null (ลูกค้าติดต่อตรง)
  const agentId = agentIdRaw && data.agents.some((a) => a.id === agentIdRaw) ? agentIdRaw : null;

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const tax = subtotal * (taxPercent / 100);
  const total = subtotal + tax;

  const quotationNumber = nextQuotationNumber(data.quotations);

  const newDeal = await insert("deals", {
    customerId,
    agentId,
    title,
    description: notes,
    projectType: "webapp",
    quotedAmount: total,
    commissionType: "percent",
    commissionValue: agentId ? 10 : 0, // ไม่มีนายหน้า = ไม่มีค่าคอม
    commissionBasis: "first_payment",
    status: "quoted",
  });

  const quotation = await insert("quotations", {
    customerId,
    agentId,
    dealId: newDeal.id,
    number: quotationNumber,
    title,
    items,
    taxPercent,
    validDays,
    notes,
    excludeHosting,
    status: "draft",
  });

  revalidateTag(DATA_TAG, { expire: 0 });
  redirect(`/quotation/${quotation.id}`);
}

export async function updateQuotationStatus(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as QuotationStatus;
  const allowed: QuotationStatus[] = ["draft", "sent", "approved", "rejected"];
  if (!id || !allowed.includes(status)) return;

  await update("quotations", id, { status });
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function deleteQuotation(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = formData.get("id") as string;
  const data = await getData();
  const quotation = data.quotations.find((q) => q.id === id);
  await remove("quotations", id);
  if (quotation) revalidateTag(DATA_TAG, { expire: 0 });
}
