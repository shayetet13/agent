import "server-only";
import { getSupabaseServer } from "./supabase-server";

export type Session = {
  type: "admin" | "broker";
  agentId: string | null;
};

export async function getSession(): Promise<Session | null> {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const role = user.user_metadata?.role as "admin" | "broker" | undefined;
  if (role === "admin") return { type: "admin", agentId: null };
  if (role === "broker") {
    return { type: "broker", agentId: (user.user_metadata?.agentId as string) ?? null };
  }
  return null;
}
