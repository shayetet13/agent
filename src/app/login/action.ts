"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { usernameToEmail } from "@/lib/auth-utils";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = (formData.get("username") ?? "").toString().trim();
  const password = (formData.get("password") ?? "").toString();
  const from = (formData.get("from") ?? "/").toString();

  if (!username || !password) return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };

  const sb = await getSupabaseServer();
  const { error } = await sb.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  // normalize ป้องกัน //evil.com หรือ /\evil.com open redirect
  const safePath = (() => {
    try {
      const p = new URL(from, "http://localhost").pathname;
      return p && p !== "/login" ? p : "/";
    } catch {
      return "/";
    }
  })();
  redirect(safePath);
}

export async function logoutAction(): Promise<void> {
  const sb = await getSupabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}
