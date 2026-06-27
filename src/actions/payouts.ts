"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { update, remove, getData, DATA_TAG } from "@/lib/db";
import { todayISO } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";
import { nextDocNumber } from "@/lib/doc-numbers";

function pinMatch(input: string, expected: string): boolean {
  if (!expected || !input) return false;
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const data = await getData();
  const payout = data.payouts.find((p) => p.id === id);
  const receiptNumber = payout?.receiptNumber
    ?? nextDocNumber(data.payouts.map((p) => p.receiptNumber), "RC");
  await update("payouts", id, { status: "paid", paidAt: todayISO(), receiptNumber });
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function markPayoutPending(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await update("payouts", id, { status: "pending", paidAt: null });
  revalidateTag(DATA_TAG, { expire: 0 });
}

export interface PinState { error?: string }

export async function markPayoutPendingWithPin(
  _prev: PinState,
  formData: FormData,
): Promise<PinState> {
  const id = String(formData.get("id") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!id) return { error: "ข้อมูลไม่ถูกต้อง" };

  const validPass = process.env.APP_PASS ?? "";
  if (!pinMatch(pin, validPass)) {
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  await update("payouts", id, { status: "pending", paidAt: null });
  revalidateTag(DATA_TAG, { expire: 0 });
  return {};
}

export interface SlipState { error?: string; url?: string }

export async function uploadPayoutSlip(
  _prev: SlipState,
  formData: FormData,
): Promise<SlipState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("payoutId") ?? "").trim();
  const file = formData.get("slip") as File | null;

  if (!id || !file || file.size === 0) return { error: "ข้อมูลไม่ครบ" };
  if (!file.type.startsWith("image/")) return { error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" };
  if (file.size > 5 * 1024 * 1024) return { error: "ไฟล์ขนาดเกิน 5 MB" };

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = `slips/${id}.${ext}`;

  const sb = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await sb.storage
    .from("slip")
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` };

  const { data: urlData } = sb.storage.from("slip").getPublicUrl(filePath);
  const url = urlData.publicUrl;

  await update("payouts", id, { slipUrl: url });
  revalidateTag(DATA_TAG, { expire: 0 });

  return { url };
}

export async function deletePayoutWithPin(
  _prev: PinState,
  formData: FormData,
): Promise<PinState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("id") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!id) return { error: "ข้อมูลไม่ถูกต้อง" };

  const validPass = process.env.APP_PASS ?? "";
  if (!pinMatch(pin, validPass)) {
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  await remove("payouts", id);
  revalidateTag(DATA_TAG, { expire: 0 });
  return {};
}
