"use server";

import { revalidateTag } from "next/cache";
import { insert, update, remove, getData, DATA_TAG } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { notifyNewLead } from "@/lib/line";
import type { LeadStatus } from "@/lib/types";

export interface LeadInput {
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
}

export async function submitLead(input: LeadInput): Promise<{ error: string }> {
  const session = await getSession();
  if (!session || session.type !== "broker" || !session.agentId) return { error: "ไม่มีสิทธิ์เข้าถึง" };

  const newLead = await insert("leads", {
    agentId: session.agentId,
    brokerName: input.brokerName,
    brokerPhone: input.brokerPhone,
    brokerLine: input.brokerLine,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerLine: input.customerLine,
    customerCompany: input.customerCompany,
    businessType: input.businessType,
    workTypes: input.workTypes,
    budget: input.budget,
    exampleUrl: input.exampleUrl,
    details: input.details,
    status: "new",
    readAt: null,
    contactedAt: null,
    convertedDealId: null,
  });

  void notifyNewLead({
    leadId: newLead.id,
    brokerName: input.brokerName,
    brokerPhone: input.brokerPhone,
    customerName: input.customerName,
    customerCompany: input.customerCompany,
    workTypes: input.workTypes,
    budget: input.budget,
  });

  revalidateTag(DATA_TAG, { expire: 0 });
  redirect("/?submitted=1");
}

export async function deleteLead(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await remove("leads", id);
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as LeadStatus;
  const allowed: LeadStatus[] = ["read", "contacted", "rejected"];
  if (!id || !allowed.includes(status)) return;

  const patch: Record<string, string | null> = { status };
  if (status === "contacted") patch.contactedAt = new Date().toISOString();

  await update("leads", id, patch as never);
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function convertLeadToDeal(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const data = await getData();
  const lead = data.leads.find((l) => l.id === id);
  if (!lead || lead.status === "converted") return;

  const customer = await insert("customers", {
    name: lead.customerName || lead.brokerName,
    phone: lead.customerPhone,
    email: "",
    company: lead.customerCompany,
    source: "lead",
    note: `Lead จากนายหน้า ${lead.brokerName} · ประเภทธุรกิจ: ${lead.businessType}`,
  });

  const agent = data.agents.find((a) => a.id === lead.agentId);
  const dealTitle = lead.businessType
    ? `${lead.businessType} — ${lead.customerName || lead.customerCompany || "ลูกค้าใหม่"}`
    : `งานใหม่ — ${lead.customerName || lead.customerCompany || "ลูกค้าใหม่"}`;

  const newDeal = await insert("deals", {
    customerId: customer.id,
    agentId: lead.agentId,
    title: dealTitle,
    description: [
      lead.details,
      lead.exampleUrl ? `ตัวอย่างเว็บ: ${lead.exampleUrl}` : "",
      lead.budget ? `งบประมาณ: ${lead.budget}` : "",
    ].filter(Boolean).join("\n"),
    projectType: "web",
    quotedAmount: 0,
    commissionType: "percent",
    commissionValue: agent?.note?.match(/\d+/) ? parseInt(agent.note.match(/\d+/)![0]) : 10,
    commissionBasis: "total_quote",
    status: "lead",
  });

  await insert("events", {
    dealId: newDeal.id,
    type: "lead_converted",
    note: `แปลงจาก Lead ของ ${lead.brokerName} (ลูกค้า: ${lead.customerName || "ไม่ระบุ"})`,
  });

  await update("leads", id, {
    status: "converted",
    convertedDealId: newDeal.id,
  });

  revalidateTag(DATA_TAG, { expire: 0 });
  redirect(`/deals/${newDeal.id}`);
}

export async function markLeadRead(id: string): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  await update("leads", id, {
    status: "read",
    readAt: new Date().toISOString(),
  });
  revalidateTag(DATA_TAG, { expire: 0 });
}
