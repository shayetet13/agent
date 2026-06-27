-- STACKA7 CRM — Supabase Schema
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → วาง SQL นี้แล้วกด Run

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  "bankName" TEXT,
  "bankAccount" TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  "lineId" TEXT,
  promptpay TEXT,
  username TEXT UNIQUE,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  "agentId" TEXT REFERENCES agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  "projectType" TEXT NOT NULL DEFAULT 'web',
  "quotedAmount" NUMERIC NOT NULL DEFAULT 0,
  "commissionType" TEXT NOT NULL DEFAULT 'percent',
  "commissionValue" NUMERIC NOT NULL DEFAULT 0,
  "commissionBasis" TEXT NOT NULL DEFAULT 'total_quote',
  status TEXT NOT NULL DEFAULT 'lead',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  "dealId" TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  "paidAt" TEXT NOT NULL DEFAULT '',
  "isFirstPayment" BOOLEAN NOT NULL DEFAULT false,
  "plannedPhases" INTEGER,
  note TEXT NOT NULL DEFAULT '',
  "slipUrls" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  "dealId" TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  "agentId" TEXT NOT NULL REFERENCES agents(id),
  "paymentId" TEXT REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  "paidAt" TEXT,
  note TEXT NOT NULL DEFAULT '',
  "slipUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  "dealId" TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL REFERENCES agents(id),
  "brokerName" TEXT NOT NULL DEFAULT '',
  "brokerPhone" TEXT NOT NULL DEFAULT '',
  "brokerLine" TEXT NOT NULL DEFAULT '',
  "customerName" TEXT NOT NULL DEFAULT '',
  "customerPhone" TEXT NOT NULL DEFAULT '',
  "customerLine" TEXT NOT NULL DEFAULT '',
  "customerCompany" TEXT NOT NULL DEFAULT '',
  "businessType" TEXT NOT NULL DEFAULT '',
  "workTypes" TEXT[] DEFAULT '{}',
  budget TEXT NOT NULL DEFAULT '',
  "exampleUrl" TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  "readAt" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  "agentId" TEXT REFERENCES agents(id),
  "dealId" TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  "taxPercent" NUMERIC NOT NULL DEFAULT 0,
  "validDays" INTEGER NOT NULL DEFAULT 30,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- events: deal activity timeline
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  "dealId" TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'deal_created',
  note TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS events_deal_idx       ON events       ("dealId");
CREATE INDEX IF NOT EXISTS deals_agent_idx       ON deals        ("agentId");
CREATE INDEX IF NOT EXISTS deals_customer_idx    ON deals        ("customerId");
CREATE INDEX IF NOT EXISTS deals_status_idx      ON deals        (status);
CREATE INDEX IF NOT EXISTS payments_deal_idx     ON payments     ("dealId");
CREATE INDEX IF NOT EXISTS payouts_deal_idx      ON payouts      ("dealId");
CREATE INDEX IF NOT EXISTS payouts_agent_idx     ON payouts      ("agentId");
CREATE INDEX IF NOT EXISTS payouts_status_idx    ON payouts      (status);
CREATE INDEX IF NOT EXISTS notes_deal_idx        ON notes        ("dealId");
CREATE INDEX IF NOT EXISTS quotations_deal_idx   ON quotations   ("dealId");
CREATE INDEX IF NOT EXISTS quotations_agent_idx  ON quotations   ("agentId");
CREATE INDEX IF NOT EXISTS leads_agent_idx       ON leads        ("agentId");
CREATE INDEX IF NOT EXISTS leads_status_idx      ON leads        (status);

-- leads: เพิ่ม column สำหรับ status ที่ครบวงจร
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "contactedAt" TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "convertedDealId" TEXT REFERENCES deals(id) ON DELETE SET NULL;

-- agents: เพิ่ม supabaseUserId สำหรับ link กับ Supabase Auth
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "supabaseUserId" TEXT UNIQUE;
-- agents: LINE QR Code image URL (จากการลงทะเบียนตัวเอง)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "lineQrUrl" TEXT;
-- agents: สถานะรีวิวของนายหน้าที่ลงทะเบียนตัวเอง ('pending' | 'approved' | 'rejected' | NULL=admin-added)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT;

-- customers: URL เว็บไซต์ของลูกค้า (optional)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "website" TEXT;

-- deals: เลขที่ใบแจ้งหนี้ รูปแบบ INV-{ปี}-{001} (เก็บครั้งแรกที่เปิดใบแจ้งหนี้)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
-- payouts: เลขที่ใบเสร็จ รูปแบบ RC-{ปี}-{001} (เก็บตอนกดจ่ายค่าคอม)
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;

-- deals: วันครบกำหนดรับเงินงวดถัดไป (สำหรับ alert งวดเกินกำหนด)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "nextPaymentDue" TEXT;

-- quotations: นายหน้าเป็น optional ได้ (ลูกค้าติดต่อตรง ไม่มีนายหน้า)
ALTER TABLE quotations ALTER COLUMN "agentId" DROP NOT NULL;

-- quotations: ระบุว่าราคาไม่รวม domain + hosting
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS "excludeHosting" BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- app ใช้ service_role key ซึ่ง bypass RLS อัตโนมัติ
-- RLS ปกป้อง anon key / authenticated role จากการ query ตรง
-- ─────────────────────────────────────────────────────────────────────────────

-- เปิด RLS ทุก table ที่มีอยู่แล้ว (ตารางใหม่ถูก enable อัตโนมัติผ่าน event trigger)
ALTER TABLE agents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;

-- ไม่สร้าง policy → empty policy = deny all สำหรับ anon/authenticated
-- service_role bypass โดย Supabase default (ไม่ต้องการ policy)
-- ถ้าต้องการ explicit deny สำหรับความชัดเจน:
-- CREATE POLICY "deny_all" ON agents USING (false) WITH CHECK (false);

-- Storage bucket สำหรับ slips (ทำใน Dashboard: Storage → New bucket → "uploads" → Public)
-- หรือรันคำสั่งนี้ถ้ามี storage extension:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT DO NOTHING;
