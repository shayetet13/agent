"use server";

import { redirect } from "next/navigation";
import { insert } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { agentSchema, formToObject } from "@/lib/schemas";
import { firstError, type FormState } from "@/lib/form";
import { notifyNewAgent } from "@/lib/line";

export async function registerAgent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const lineId = formData.get("lineId")?.toString().trim() ?? "";
  const lineQrFile = formData.get("lineQrFile") as File | null;
  const hasQr = lineQrFile && lineQrFile.size > 0;

  if (!lineId && !hasQr) {
    return { error: "กรุณาระบุ LINE ID หรืออัปโหลด QR Code LINE" };
  }

  const result = agentSchema.safeParse(formToObject(formData));
  if (!result.success) return { error: firstError(result) };

  let lineQrUrl: string | undefined;
  if (hasQr) {
    if (!lineQrFile.type.startsWith("image/"))
      return { error: "ไฟล์ QR ต้องเป็นรูปภาพเท่านั้น (jpg, png, webp)" };
    if (lineQrFile.size > 2 * 1024 * 1024)
      return { error: "ไฟล์ QR ขนาดเกิน 2 MB" };

    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    const ext = (lineQrFile.name.split(".").pop() ?? "").toLowerCase();
    if (!allowedExts.includes(ext))
      return { error: "นามสกุลไฟล์ไม่รองรับ" };

    const path = `line-qr/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const sb = getSupabaseAdmin();
    const { error: uploadError } = await sb.storage
      .from("slip")
      .upload(path, lineQrFile, { upsert: false, contentType: lineQrFile.type });
    if (uploadError) return { error: `อัปโหลด QR ไม่สำเร็จ: ${uploadError.message}` };
    lineQrUrl = sb.storage.from("slip").getPublicUrl(path).data.publicUrl;
  }

  await insert("agents", {
    ...result.data,
    ...(lineQrUrl ? { lineQrUrl } : {}),
    reviewStatus: "pending",
  });

  void notifyNewAgent({
    name: result.data.name,
    phone: result.data.phone ?? "",
    lineId: result.data.lineId ?? "",
    lineQrUploaded: !!lineQrUrl,
  });

  redirect("/register/success");
}
