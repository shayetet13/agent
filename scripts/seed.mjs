/**
 * Seed ข้อมูลตัวอย่างลงใน Supabase
 * รัน:  node scripts/seed.mjs
 *
 * ⚠️  จะ INSERT ข้อมูลใหม่เท่านั้น ไม่ลบข้อมูลเดิม
 *     ถ้าต้องการ reset ให้ลบตารางใน Supabase Dashboard ก่อน
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// โหลด .env.local
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    }),
);

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ ไม่พบ SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const nanoid = (size = 21) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < size; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

const ts = new Date().toISOString();

// ─── Seed Data ──────────────────────────────────────────────────────────────

const agents = [
  { id: nanoid(), name: "สมชาย ใจดี", phone: "081-234-5678", email: "somchai@example.com", "bankAccount": "กสิกร 123-4-56789-0", note: "", createdAt: ts, updatedAt: ts },
  { id: nanoid(), name: "วิไล รักสวัสดิ์", phone: "089-876-5432", email: "wilai@example.com", "bankAccount": "ไทยพาณิชย์ 987-6-54321-0", note: "นายหน้าชั้นดี ลูกค้าประจำ", createdAt: ts, updatedAt: ts },
];

const customers = [
  { id: nanoid(), name: "บริษัท ABC จำกัด", phone: "02-123-4567", email: "info@abc.co.th", company: "ABC Co., Ltd.", source: "Referral", note: "", createdAt: ts, updatedAt: ts },
  { id: nanoid(), name: "คุณมานะ พัฒนา", phone: "085-111-2222", email: "mana@gmail.com", company: "", source: "Facebook", note: "ลูกค้าใหม่ สนใจเว็บร้านค้า", createdAt: ts, updatedAt: ts },
  { id: nanoid(), name: "ร้านอาหารสุขใจ", phone: "044-333-4444", email: "", company: "สุขใจ กรุ๊ป", source: "Walk-in", note: "", createdAt: ts, updatedAt: ts },
];

const deals = [
  {
    id: nanoid(),
    customerId: customers[0].id,
    agentId: agents[0].id,
    title: "เว็บไซต์ ABC Corporate",
    description: "เว็บไซต์องค์กร 5 หน้า พร้อมระบบ CMS",
    projectType: "web",
    quotedAmount: 85000,
    commissionType: "percent",
    commissionValue: 10,
    commissionBasis: "first_payment",
    status: "first_payment",
    createdAt: ts, updatedAt: ts,
  },
  {
    id: nanoid(),
    customerId: customers[1].id,
    agentId: agents[1].id,
    title: "เว็บแอปร้านค้าออนไลน์ มานะ",
    description: "ระบบร้านค้าออนไลน์พร้อมระบบสต็อก",
    projectType: "webapp",
    quotedAmount: 150000,
    commissionType: "percent",
    commissionValue: 8,
    commissionBasis: "total_quote",
    status: "in_progress",
    createdAt: ts, updatedAt: ts,
  },
  {
    id: nanoid(),
    customerId: customers[2].id,
    agentId: null,
    title: "เว็บเมนูร้านอาหารสุขใจ",
    description: "เว็บไซต์เมนูอาหารออนไลน์",
    projectType: "web",
    quotedAmount: 25000,
    commissionType: "fixed",
    commissionValue: 0,
    commissionBasis: "first_payment",
    status: "lead",
    createdAt: ts, updatedAt: ts,
  },
];

const firstDeal = deals[0];
const payments = [
  {
    id: nanoid(),
    dealId: firstDeal.id,
    amount: 42500,
    paidAt: "2026-06-01",
    isFirstPayment: true,
    note: "รับมัดจำ 50%",
    createdAt: ts, updatedAt: ts,
  },
];

const payouts = [
  {
    id: nanoid(),
    dealId: firstDeal.id,
    agentId: agents[0].id,
    amount: 4250,
    status: "pending",
    paidAt: null,
    note: "",
    createdAt: ts, updatedAt: ts,
  },
];

// ─── Insert ──────────────────────────────────────────────────────────────────

async function seedTable(table, rows) {
  if (!rows.length) return;
  const { error } = await sb.from(table).insert(rows);
  if (error) {
    console.error(`❌ ${table}:`, error.message);
  } else {
    console.log(`  ✓ ${table}: ${rows.length} rows`);
  }
}

console.log("⚙  Seeding Supabase...");
await seedTable("agents", agents);
await seedTable("customers", customers);
await seedTable("deals", deals);
await seedTable("payments", payments);
await seedTable("payouts", payouts);

console.log("✅ seed สำเร็จ");
