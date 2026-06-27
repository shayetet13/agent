const PUSH_URL = "https://api.line.me/v2/bot/message/push";

interface AgentNotifyInput {
  name: string;
  phone: string;
  lineId: string;
  lineQrUploaded: boolean;
}

export async function notifyNewAgent(agent: AgentNotifyInput): Promise<void> {
  const token  = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const target = process.env.LINE_NOTIFY_TARGET;
  if (!token || !target) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:7777";

  const text = [
    "🆕 นายหน้าลงทะเบียนใหม่!",
    "",
    `👤 ชื่อ: ${agent.name}`,
    agent.phone ? `📞 เบอร์: ${agent.phone}` : null,
    agent.lineId ? `💬 LINE ID: ${agent.lineId}` : null,
    agent.lineQrUploaded ? "📷 แนบ LINE QR Code มาด้วย" : null,
    "",
    `👉 ดูและเปิดใช้งาน: ${appUrl}/agents`,
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch(PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: target, messages: [{ type: "text", text }] }),
    });
    if (!res.ok) console.error(`[LINE] agent notify failed: ${res.status}`, await res.text());
  } catch (err) {
    console.error("[LINE] agent notify error:", err);
  }
}

interface LeadNotifyInput {
  leadId: string;
  brokerName: string;
  brokerPhone: string;
  customerName: string;
  customerCompany: string;
  workTypes: string[];
  budget: string;
}

export async function notifyNewLead(lead: LeadNotifyInput): Promise<void> {
  const token  = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const target = process.env.LINE_NOTIFY_TARGET;
  if (!token || !target) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:7777";
  const works  = lead.workTypes.join(", ") || "—";

  const text = [
    "📋 Lead ใหม่เข้ามา!",
    "",
    `👤 นายหน้า: ${lead.brokerName} (${lead.brokerPhone})`,
    `🏢 ลูกค้า: ${lead.customerName}${lead.customerCompany ? ` · ${lead.customerCompany}` : ""}`,
    `🔧 งาน: ${works}`,
    `💰 งบ: ${lead.budget}`,
    "",
    `👉 ดูเลย: ${appUrl}/leads/${lead.leadId}`,
  ].join("\n");

  try {
    const res = await fetch(PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: target, messages: [{ type: "text", text }] }),
    });
    if (!res.ok) console.error(`[LINE] push failed: ${res.status}`, await res.text());
  } catch (err) {
    console.error("[LINE] fetch error:", err);
  }
}
