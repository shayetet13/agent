"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { insert, update, remove, getData, DATA_TAG } from "@/lib/db";
import { getSession } from "@/lib/session";
import { dealSchema, formToObject, paymentSchema } from "@/lib/schemas";
import { firstError, type FormState } from "@/lib/form";
import type { Deal, EventType } from "@/lib/types";

async function logEvent(dealId: string, type: EventType, note: string) {
  try {
    await insert("events", { dealId, type, note });
  } catch {
    // event logging ไม่ควร break main flow
  }
}

export async function saveDeal(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("id") ?? "").trim();
  const result = dealSchema.safeParse(formToObject(formData));
  if (!result.success) return { error: firstError(result) };

  let dealId = id;
  if (id) {
    await update("deals", id, result.data);
    await logEvent(id, "status_changed", `แก้ไขข้อมูลดีล`);
  } else {
    const created = await insert("deals", result.data);
    dealId = created.id;
    await logEvent(dealId, "deal_created", `สร้างดีล "${result.data.title}"`);
  }
  revalidateTag(DATA_TAG, { expire: 0 });
  redirect(`/deals/${dealId}`);
}

export async function deleteDeal(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await remove("deals", id);
  revalidateTag(DATA_TAG, { expire: 0 });
}

/** ใช้ใน <form action> — return void เพื่อ satisfy TypeScript */
export async function changeDealStatus(formData: FormData): Promise<void> {
  await updateDealStatus(formData);
}

export async function updateDealStatus(formData: FormData): Promise<{ error?: string } | void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const parsed = dealSchema.shape.status.safeParse(status);
  if (!id || !parsed.success) return;

  // ถ้า deal ปัจจุบันเป็น "cancelled" → ต้องยืนยัน PIN ก่อนเปลี่ยน
  const data = await getData();
  const deal = data.deals.find((d) => d.id === id);
  if (deal?.status === "cancelled") {
    const pin = String(formData.get("pin") ?? "").trim();
    const adminPin = process.env.ADMIN_UNLOCK_PIN ?? "";
    if (!adminPin) return { error: "ยังไม่ได้ตั้งค่า ADMIN_UNLOCK_PIN ใน .env.local" };
    const safe = (() => { try { return timingSafeEqual(Buffer.from(pin), Buffer.from(adminPin)); } catch { return false; } })();
    if (!safe) return { error: "รหัสไม่ถูกต้อง" };
  }

  await update("deals", id, { status: parsed.data });
  await logEvent(id, "status_changed", `เปลี่ยนสถานะเป็น "${parsed.data}"`);
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function addPayment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const result = paymentSchema.safeParse(formToObject(formData));
  if (!result.success) return { error: firstError(result) };
  const input = result.data;

  const data = await getData();
  const deal = data.deals.find((d) => d.id === input.dealId);
  if (!deal) return { error: "ไม่พบดีล" };

  const newPayment = await insert("payments", {
    dealId: input.dealId,
    amount: input.amount,
    paidAt: input.paidAt,
    isFirstPayment: input.isFirstPayment,
    ...(input.plannedPhases ? { plannedPhases: input.plannedPhases } : {}),
    note: input.note,
  });

  // อัปเดตดีล: ขึ้นสถานะ "รับเงินก้อนแรก" + ล้างวันครบกำหนด (งวดนี้ได้รับแล้ว)
  const dealPatch: Partial<Pick<Deal, "status" | "nextPaymentDue">> = {};
  if (input.isFirstPayment && deal.status !== "completed" && deal.status !== "cancelled") {
    dealPatch.status = "first_payment";
  }
  if (deal.nextPaymentDue) dealPatch.nextPaymentDue = null;
  if (Object.keys(dealPatch).length > 0) {
    await update("deals", deal.id, dealPatch);
  }

  const alreadyHasPayout = data.payouts.some((p) => p.dealId === deal.id);
  if (input.isFirstPayment && !alreadyHasPayout && deal.agentId && deal.commissionValue > 0) {
    const base = deal.quotedAmount > 0 ? deal.quotedAmount : input.amount;
    const commissionAmount = Math.round((base * deal.commissionValue) / 100 * 100) / 100;
    await insert("payouts", {
      dealId: deal.id,
      agentId: deal.agentId,
      paymentId: newPayment.id,
      amount: commissionAmount,
      status: "pending",
      paidAt: null,
      note: `ค่าคอม ${deal.commissionValue}% จากราคาเต็ม ${base.toLocaleString("th-TH")} บาท`,
    });
    await logEvent(deal.id, "payout_created", `สร้าง payout ค่าคอม ${commissionAmount.toLocaleString("th-TH")} บาท`);
  }

  await logEvent(deal.id, "payment_added", `รับเงิน ${input.amount.toLocaleString("th-TH")} บาท${input.note ? ` — ${input.note}` : ""}`);
  revalidateTag(DATA_TAG, { expire: 0 });
  return {};
}

export async function deletePayment(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await remove("payments", id);
  revalidateTag(DATA_TAG, { expire: 0 });
}
