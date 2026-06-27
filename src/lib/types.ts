// โดเมนหลักของระบบนายหน้า (Referral CRM)

export type ProjectType = "web" | "webapp" | "other";

export type CommissionType = "percent" | "fixed";
export type CommissionBasis = "first_payment" | "total_quote";

export type DealStatus =
  | "lead"
  | "contacted"
  | "quoted"
  | "in_progress"
  | "first_payment"
  | "commission_paid"
  | "completed"
  | "cancelled";

export type PayoutStatus = "pending" | "paid";

interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent extends BaseRecord {
  name: string;
  phone: string;
  email: string;
  bankName?: string;
  bankAccount: string;
  note: string;
  lineId?: string;
  promptpay?: string;
  lineQrUrl?: string;
  username?: string;
  passwordHash?: string;
  supabaseUserId?: string;
  reviewStatus?: string | null;
}

export interface Customer extends BaseRecord {
  name: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  note: string;
  website?: string | null;
}

export interface Deal extends BaseRecord {
  customerId: string;
  agentId: string | null;
  title: string;
  description: string;
  projectType: ProjectType;
  quotedAmount: number;
  commissionType: CommissionType;
  commissionValue: number;
  commissionBasis: CommissionBasis;
  status: DealStatus;
  nextPaymentDue?: string | null;
  invoiceNumber?: string | null;
}

export interface Payment extends BaseRecord {
  dealId: string;
  amount: number;
  paidAt: string; // YYYY-MM-DD
  isFirstPayment: boolean;
  plannedPhases?: number; // จำนวนงวดที่วางแผนไว้ (บันทึกตอนงวดแรก)
  note: string;
  slipUrls?: string[];  // สลิปโอนเงินจากลูกค้า (หลายรูปได้)
}

export interface Payout extends BaseRecord {
  dealId: string;
  agentId: string;
  paymentId?: string;   // เชื่อมกับ Payment.id (optional, backward compat)
  amount: number;
  status: PayoutStatus;
  paidAt: string | null;
  note: string;
  slipUrl?: string;
  receiptNumber?: string | null;
}

export interface Note extends BaseRecord {
  dealId: string;
  text: string;
}

export type LeadStatus = "new" | "read" | "contacted" | "converted" | "rejected";

export interface Lead extends BaseRecord {
  agentId: string;
  brokerName: string;
  brokerPhone: string;
  brokerLine: string;
  customerName: string;
  customerPhone: string;
  customerLine: string;
  customerCompany: string;
  businessType: string;
  workTypes: string[];
  budget: string;
  exampleUrl: string;
  details: string;
  status: LeadStatus;
  readAt: string | null;
  contactedAt: string | null;
  convertedDealId: string | null;
}

export type EventType =
  | "deal_created"
  | "payment_added"
  | "status_changed"
  | "note_added"
  | "payout_created"
  | "lead_converted";

export interface DealEvent extends BaseRecord {
  dealId: string;
  type: EventType;
  note: string;
}

export interface QuotationItem {
  description: string;
  qty: number;
  unitPrice: number;
}

export type QuotationStatus = "draft" | "sent" | "approved" | "rejected";

export interface Quotation extends BaseRecord {
  customerId: string;
  agentId: string | null;  // นายหน้าที่จัดหาลูกค้า (null = ลูกค้าติดต่อตรง ไม่มีนายหน้า)
  dealId: string;          // ดีลที่สร้างอัตโนมัติจากใบเสนอราคา
  number: string;          // QT-2025-001
  title: string;
  items: QuotationItem[];
  taxPercent: number;      // 0 หรือ 7
  validDays: number;       // อายุใบเสนอราคา (วัน)
  notes: string;
  status: QuotationStatus;
  excludeHosting: boolean; // true = ระบุในเงื่อนไขว่าราคานี้ไม่รวม domain + hosting
}

export interface Database {
  agents: Agent[];
  customers: Customer[];
  deals: Deal[];
  payments: Payment[];
  payouts: Payout[];
  notes: Note[];
  leads: Lead[];
  quotations: Quotation[];
  events: DealEvent[];
}

export type Collection = keyof Database;

// ป้ายกำกับภาษาไทยสำหรับสถานะดีล
export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  lead: "ลูกค้าใหม่",
  contacted: "ติดต่อแล้ว",
  quoted: "เสนอราคา",
  in_progress: "กำลังทำ",
  first_payment: "รับเงินก้อนแรก",
  commission_paid: "จ่ายค่านายหน้าแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export const DEAL_STATUS_ORDER: DealStatus[] = [
  "lead",
  "contacted",
  "quoted",
  "in_progress",
  "first_payment",
  "commission_paid",
  "completed",
  "cancelled",
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web: "เว็บไซต์",
  webapp: "เว็บแอป",
  other: "อื่นๆ",
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "ใหม่",
  read: "อ่านแล้ว",
  contacted: "ติดต่อแล้ว",
  converted: "แปลงเป็นดีล",
  rejected: "ไม่รับ",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-orange-100 text-orange-700",
  read: "bg-blue-100 text-blue-700",
  contacted: "bg-indigo-100 text-indigo-700",
  converted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  deal_created: "สร้างดีล",
  payment_added: "รับเงิน",
  status_changed: "เปลี่ยนสถานะ",
  note_added: "เพิ่มโน้ต",
  payout_created: "สร้าง payout",
  lead_converted: "แปลงจาก Lead",
};

export const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

/** Maps deal status to Badge variant — shared across all pages */
export function statusVariant(s: string): BadgeVariant {
  if (s === "completed" || s === "commission_paid") return "success";
  if (s === "cancelled") return "danger";
  if (s === "first_payment") return "warning";
  if (s === "lead") return "muted";
  return "default";
}
