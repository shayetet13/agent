import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => v ?? "");

export const agentSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อนายหน้า").max(120),
  phone: optionalText,
  email: z.union([z.string().trim().email("อีเมลไม่ถูกต้อง"), z.literal("")]).optional().transform((v) => v ?? ""),
  bankName: optionalText,
  bankAccount: optionalText,
  note: optionalText,
  lineId: optionalText,
  promptpay: optionalText,
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(120),
  phone: optionalText,
  email: z.union([z.string().trim().email("อีเมลไม่ถูกต้อง"), z.literal("")]).optional().transform((v) => v ?? ""),
  company: optionalText,
  source: optionalText,
  note: optionalText,
  website: z.union([
    z.string().trim().url("URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://)").max(500)
      .refine((v) => v.startsWith("https://") || v.startsWith("http://"), "URL ไม่ถูกต้อง"),
    z.literal(""),
  ]).optional().transform((v) => v ?? ""),
});

export const dealSchema = z.object({
  customerId: z.string().trim().min(1, "กรุณาเลือกลูกค้า"),
  agentId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  title: z.string().trim().min(1, "กรุณากรอกชื่องาน").max(160),
  description: optionalText,
  projectType: z.enum(["web", "webapp", "other"]),
  quotedAmount: z.coerce.number().min(0, "ยอดต้องไม่ติดลบ"),
  commissionType: z.enum(["percent", "fixed"]).default("percent"),
  commissionValue: z.coerce.number().min(0, "ค่าคอมต้องไม่ติดลบ").default(10),
  commissionBasis: z.enum(["first_payment", "total_quote"]).default("first_payment"),
  nextPaymentDue: z
    .union([z.string().trim(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  status: z
    .enum([
      "lead",
      "contacted",
      "quoted",
      "in_progress",
      "first_payment",
      "commission_paid",
      "completed",
      "cancelled",
    ])
    .default("lead"),
});

export const paymentSchema = z.object({
  dealId: z.string().trim().min(1),
  amount: z.coerce.number().positive("ยอดเงินต้องมากกว่า 0"),
  paidAt: z.string().trim().min(1, "กรุณาเลือกวันที่"),
  isFirstPayment: z.string().optional().transform(v => v === "true"),
  plannedPhases: z.coerce.number().int().min(1).optional(),
  note: optionalText,
});

export const noteSchema = z.object({
  dealId: z.string().trim().min(1),
  text: z.string().trim().min(1, "กรุณากรอกข้อความ").max(1000),
});

export const quotationSchema = z.object({
  customerId: z.string().trim().min(1, "กรุณาเลือกลูกค้า"),
  agentId: z.string().trim().min(1, "กรุณาเลือกนายหน้า"),
  title: z.string().trim().min(1, "กรุณากรอกชื่อโปรเจค").max(160),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  validDays: z.coerce.number().min(1).default(30),
  notes: optionalText,
});

export type AgentInput = z.infer<typeof agentSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;

/** แปลง FormData → object ธรรมดา (รองรับ checkbox) */
export function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}
