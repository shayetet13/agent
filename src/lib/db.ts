import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "./supabase";
import type { Collection, Database } from "./types";

const now = () => new Date().toISOString();

type NewRecord<C extends Collection> = Omit<Database[C][number], "id" | "createdAt" | "updatedAt">;
type RecordPatch<C extends Collection> = Partial<NewRecord<C>>;

export const DATA_TAG = "app-data";

// ──────────────────────────────────────────────────────────────────────────────
// getData — cross-request cache (30s TTL) + request-level dedup
// ──────────────────────────────────────────────────────────────────────────────
const fetchAllData = unstable_cache(
  async (): Promise<Database> => {
    const sb = getSupabaseAdmin();
    const [
      { data: agents },
      { data: customers },
      { data: deals },
      { data: payments },
      { data: payouts },
      { data: notes },
      { data: leads },
      { data: quotations },
      { data: events },
    ] = await Promise.all([
      sb.from("agents").select("*").order("createdAt" as never),
      sb.from("customers").select("*").order("createdAt" as never),
      sb.from("deals").select("*").order("createdAt" as never),
      sb.from("payments").select("*").order("createdAt" as never),
      sb.from("payouts").select("*").order("createdAt" as never),
      sb.from("notes").select("*").order("createdAt" as never),
      sb.from("leads").select("*").order("createdAt" as never, { ascending: false }),
      sb.from("quotations").select("*").order("createdAt" as never),
      sb.from("events").select("*").order("createdAt" as never),
    ]);

    return {
      agents:     (agents     ?? []) as unknown as Database["agents"],
      customers:  (customers  ?? []) as unknown as Database["customers"],
      deals:      (deals      ?? []) as unknown as Database["deals"],
      payments:   (payments   ?? []) as unknown as Database["payments"],
      payouts:    (payouts    ?? []) as unknown as Database["payouts"],
      notes:      (notes      ?? []) as unknown as Database["notes"],
      leads:      (leads      ?? []) as unknown as Database["leads"],
      quotations: (quotations ?? []) as unknown as Database["quotations"],
      events:     (events     ?? []) as unknown as Database["events"],
    };
  },
  [DATA_TAG],
  { revalidate: 30, tags: [DATA_TAG] },
);

// cache() deduplicates calls within a single render pass
// (layout + page both call getData → only 1 actual Supabase round-trip)
export const getData = cache(fetchAllData);

// ──────────────────────────────────────────────────────────────────────────────
// Mutation helpers
// ──────────────────────────────────────────────────────────────────────────────
export async function insert<C extends Collection>(
  collection: C,
  values: NewRecord<C>,
): Promise<Database[C][number]> {
  const sb = getSupabaseAdmin();
  const ts = now();
  const record = { ...values, id: nanoid(), createdAt: ts, updatedAt: ts };
  const { data, error } = await sb.from(collection).insert(record as never).select().single();
  if (error) throw new Error(`[DB] insert ${collection}: ${error.message}`);
  return data as unknown as Database[C][number];
}

export async function update<C extends Collection>(
  collection: C,
  id: string,
  patch: RecordPatch<C>,
): Promise<Database[C][number] | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from(collection)
    .update(Object.assign({}, patch, { updatedAt: now() }) as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`[DB] update ${collection}: ${error.message}`);
  return data as unknown as Database[C][number];
}

export async function remove<C extends Collection>(
  collection: C,
  id: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from(collection).delete().eq("id", id);
  if (error) throw new Error(`[DB] remove ${collection}: ${error.message}`);
}
