"use server";

import { revalidateTag } from "next/cache";
import { getData, update, DATA_TAG } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface PaymentSlipState { error?: string; url?: string }
export interface DeleteSlipState { error?: string; deleted?: string }

export async function uploadPaymentSlip(
  _prev: PaymentSlipState,
  formData: FormData,
): Promise<PaymentSlipState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const paymentId  = String(formData.get("paymentId")  ?? "").trim();
  const file = formData.get("slip") as File | null;

  if (!paymentId || !file || file.size === 0) return { error: "ข้อมูลไม่ครบ" };
  if (!file.type.startsWith("image/"))        return { error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" };
  if (file.size > 10 * 1024 * 1024)           return { error: "ไฟล์ขนาดเกิน 10 MB" };

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = `payment-slips/${paymentId}-${Date.now()}.${ext}`;

  const sb = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await sb.storage
    .from("slip")
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` };

  const { data: urlData } = sb.storage.from("slip").getPublicUrl(filePath);
  const url = urlData.publicUrl;

  const data = await getData();
  const payment = data.payments.find((p) => p.id === paymentId);
  const existing = payment?.slipUrls ?? [];
  await update("payments", paymentId, { slipUrls: [...existing, url] });

  revalidateTag(DATA_TAG, { expire: 0 });
  return { url };
}

export async function deletePaymentSlip(
  _prev: DeleteSlipState,
  formData: FormData,
): Promise<DeleteSlipState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const url       = String(formData.get("url")       ?? "").trim();

  if (!paymentId || !url) return { error: "ข้อมูลไม่ครบ" };

  const marker = "/object/public/slip/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const filePath = url.slice(idx + marker.length);
    const sb = getSupabaseAdmin();
    await sb.storage.from("slip").remove([filePath]);
  }

  const data = await getData();
  const payment = data.payments.find((p) => p.id === paymentId);
  const updated = (payment?.slipUrls ?? []).filter((u) => u !== url);
  await update("payments", paymentId, { slipUrls: updated });

  revalidateTag(DATA_TAG, { expire: 0 });
  return { deleted: url };
}
