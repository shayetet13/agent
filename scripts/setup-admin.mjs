/**
 * One-time script: ตั้งค่า admin user ใน Supabase Auth
 * วิธีใช้: node scripts/setup-admin.mjs <username> <password>
 * ตัวอย่าง: node scripts/setup-admin.mjs dev Root#77
 *
 * ระบบจะ map username → username@stacka7.co.th ภายใน Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const LOGIN_DOMAIN = "stacka7.co.th";

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

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("❌ Usage: node scripts/setup-admin.mjs <username> <password>");
  process.exit(1);
}

const email = `${username}@${LOGIN_DOMAIN}`;
console.log(`⚙  username: ${username}  →  internal email: ${email}`);

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: list, error: listErr } = await sb.auth.admin.listUsers();
if (listErr) {
  console.error("❌ listUsers error:", listErr.message);
  process.exit(1);
}

// ค้นหา user จาก email ใหม่ หรือ email เดิม (ipbpower@gmail.com → dev@stacka7.co.th)
const existing = list.users.find((u) => u.email === email) ?? list.users.find((u) => u.user_metadata?.role === "admin");

if (existing) {
  console.log(`✓ พบ user เดิม: ${existing.email} (id: ${existing.id})`);
  const { error } = await sb.auth.admin.updateUserById(existing.id, {
    email,
    password,
    user_metadata: { role: "admin" },
  });
  if (error) {
    console.error("❌ อัปเดต user ล้มเหลว:", error.message);
    process.exit(1);
  }
  console.log("✅ อัปเดต admin เรียบร้อย");
} else {
  const { error } = await sb.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: "admin" },
    email_confirm: true,
  });
  if (error) {
    console.error("❌ สร้าง user ล้มเหลว:", error.message);
    process.exit(1);
  }
  console.log("✅ สร้าง admin user เรียบร้อย");
}

console.log("\n=== Login credentials ===");
console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
