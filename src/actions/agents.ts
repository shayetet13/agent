"use server";

import { revalidateTag } from "next/cache";
import { DATA_TAG } from "@/lib/db";
import { redirect } from "next/navigation";
import { insert, remove, update, getData } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase";
import { usernameToEmail } from "@/lib/auth-utils";
import { agentSchema, formToObject } from "@/lib/schemas";
import { firstError, type FormState } from "@/lib/form";
import { getSession } from "@/lib/session";

export async function saveAgent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("id") ?? "").trim();
  const result = agentSchema.safeParse(formToObject(formData));
  if (!result.success) return { error: firstError(result) };

  if (id) {
    await update("agents", id, result.data);
  } else {
    await insert("agents", result.data);
  }
  revalidateTag(DATA_TAG, { expire: 0 });
  redirect("/agents");
}

export async function deleteAgent(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const data = await getData();
  const hasPayouts = data.payouts.some((p) => p.agentId === id);
  const hasLeads = data.leads.some((l) => l.agentId === id);

  if (hasPayouts || hasLeads) {
    const reason = [
      hasPayouts && "มีข้อมูลค่าคอมมิชชั่น",
      hasLeads && "มีข้อมูลลีด",
    ].filter(Boolean).join(" และ ");
    throw new Error(`ไม่สามารถลบนายหน้าได้ เนื่องจาก${reason}ผูกอยู่ในระบบ`);
  }

  await remove("agents", id);
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function approveAgent(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await update("agents", id, { reviewStatus: "approved" });
    revalidateTag(DATA_TAG, { expire: 0 });
  }
}

export async function rejectAgent(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await remove("agents", id);
    revalidateTag(DATA_TAG, { expire: 0 });
  }
}

export async function saveAgentCredentials(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = formData.get("id")?.toString().trim() ?? "";
  const username = formData.get("username")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!id) return { error: "ไม่พบข้อมูลนายหน้า" };
  if (!username) return { error: "กรุณาระบุ username สำหรับ login" };

  const data = await getData();
  const agent = data.agents.find((a) => a.id === id);
  if (!agent) return { error: "ไม่พบนายหน้า" };

  // ตรวจ username ซ้ำ
  const dup = data.agents.find((a) => a.username === username && a.id !== id);
  if (dup) return { error: `Username "${username}" ถูกใช้งานแล้วโดย ${dup.name}` };

  const email = usernameToEmail(username);
  const sb = getSupabaseAdmin();
  const supabaseUserId = agent.supabaseUserId;

  if (supabaseUserId) {
    // อัปเดต user ที่มีอยู่แล้ว
    const updates: { email: string; password?: string } = { email };
    if (password) updates.password = password;
    const { error } = await sb.auth.admin.updateUserById(supabaseUserId, updates);
    if (error) return { error: `ไม่สามารถอัปเดต login: ${error.message}` };
  } else {
    // สร้าง Supabase user ใหม่
    if (!password) return { error: "กรุณาตั้งรหัสผ่านสำหรับ login ใหม่" };
    const { data: created, error } = await sb.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: "broker", agentId: id },
      email_confirm: true,
    });
    if (error) return { error: `ไม่สามารถสร้าง login: ${error.message}` };
    await update("agents", id, { supabaseUserId: created.user.id, username });
  }

  revalidateTag(DATA_TAG, { expire: 0 });
  return { ok: true };
}
