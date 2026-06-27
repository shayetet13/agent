import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { markLeadRead, deleteLead, updateLeadStatus, convertLeadToDeal } from "@/actions/leads";
import { formatDate } from "@/lib/format";
import { DeleteButton } from "@/components/DeleteButton";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/types";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.type !== "admin") redirect("/");

  const { id } = await params;
  const data = await getData();
  const lead = data.leads.find((l) => l.id === id);
  if (!lead) notFound();

  const agent = data.agents.find((a) => a.id === lead.agentId);
  const convertedDeal = lead.convertedDealId
    ? data.deals.find((d) => d.id === lead.convertedDealId)
    : null;

  // Auto-mark as read — ใช้ after() เพื่อ defer revalidateTag ออกจาก render phase
  if (lead.status === "new") {
    after(() => markLeadRead(id));
  }

  const canContact = lead.status === "read";
  const canConvert = lead.status === "read" || lead.status === "contacted";
  const canReject  = lead.status === "read" || lead.status === "contacted";
  const isTerminal = lead.status === "converted" || lead.status === "rejected";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back + header */}
      <div>
        <Link href="/leads" className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1 mb-3">
          ← กลับรายการ
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lead.customerName || "ไม่ระบุชื่อ"}
            </h1>
            {lead.customerCompany && (
              <p className="text-muted text-sm mt-0.5">{lead.customerCompany}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${LEAD_STATUS_COLORS[lead.status]}`}>
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
            <span className="text-xs text-slate-400">{formatDate(lead.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Converted deal link */}
      {convertedDeal && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-green-50 border-green-200 text-sm">
          <span className="text-green-600 text-base">✅</span>
          <div className="flex-1">
            <p className="font-semibold text-green-800">แปลงเป็นดีลแล้ว</p>
            <p className="text-green-700 text-xs">{convertedDeal.title}</p>
          </div>
          <Link href={`/deals/${convertedDeal.id}`} className="text-xs font-medium text-green-700 hover:underline shrink-0">
            ดูดีล →
          </Link>
        </div>
      )}

      {/* Status actions */}
      {!isTerminal && (
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-muted uppercase tracking-wide">อัพเดทสถานะ</p>
          <div className="flex flex-wrap gap-2">
            {canContact && (
              <form action={updateLeadStatus}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="contacted" />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  ติดต่อแล้ว
                </button>
              </form>
            )}
            {canConvert && (
              <form action={convertLeadToDeal}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
                >
                  แปลงเป็น Deal →
                </button>
              </form>
            )}
            {canReject && (
              <form action={updateLeadStatus}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="rejected" />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                >
                  ไม่รับงานนี้
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Cards */}
      <Section title="นายหน้าที่แนะนำ">
        <Row label="ชื่อ" value={lead.brokerName || agent?.name || "—"} />
        <Row label="เบอร์โทร" value={lead.brokerPhone || agent?.phone || "—"} phone />
        <Row label="LINE ID" value={lead.brokerLine || agent?.lineId || "—"} />
      </Section>

      <Section title="ข้อมูลลูกค้า">
        <Row label="ชื่อ" value={lead.customerName} />
        <Row label="เบอร์โทร" value={lead.customerPhone} phone />
        <Row label="LINE ID" value={lead.customerLine} />
        <Row label="บริษัท / ร้านค้า" value={lead.customerCompany} />
      </Section>

      <Section title="ความต้องการ">
        <Row label="ประเภทธุรกิจ" value={lead.businessType} />
        <Row label="งบประมาณ" value={lead.budget} />
        {lead.exampleUrl && <Row label="เว็บตัวอย่าง" value={lead.exampleUrl} href={lead.exampleUrl} />}
      </Section>

      {lead.workTypes.length > 0 && (
        <Section title="ประเภทงานที่ต้องการ">
          <div className="flex flex-wrap gap-2 pt-1">
            {lead.workTypes.map((wt) => (
              <span
                key={wt}
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
              >
                {wt}
              </span>
            ))}
          </div>
        </Section>
      )}

      {lead.details && (
        <Section title="หมายเหตุ / รายละเอียดเพิ่มเติม">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.details}</p>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/leads"
          className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          ← กลับรายการ
        </Link>
        {(lead.customerPhone || agent?.phone) && (
          <a
            href={`tel:${lead.customerPhone || agent?.phone}`}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
          >
            โทรหาลูกค้า
          </a>
        )}
        <div className="ml-auto">
          <DeleteButton
            action={deleteLead}
            id={lead.id}
            confirmTitle="ลบ Lead นี้?"
            confirmMessage={`ลบ Lead ของ "${lead.customerName || "ไม่ระบุชื่อ"}" ออกจากระบบ? ไม่สามารถกู้คืนได้`}
            label="ลบ Lead"
            redirectTo="/leads"
          />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-slate-50">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value, phone, href }: { label: string; value: string; phone?: boolean; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 text-sm">
      <span className="text-muted shrink-0 w-28">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium break-all">
          {value}
        </a>
      ) : phone ? (
        <a href={`tel:${value}`} className="text-slate-800 font-medium hover:text-accent transition-colors">
          {value}
        </a>
      ) : (
        <span className="text-slate-800 font-medium">{value}</span>
      )}
    </div>
  );
}
