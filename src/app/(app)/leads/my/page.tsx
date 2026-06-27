import { redirect } from "next/navigation";
import Link from "next/link";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/types";

export default async function MyLeadsPage() {
  const session = await getSession();
  if (!session || session.type !== "broker" || !session.agentId) redirect("/login");

  const data = await getData();
  const leads = data.leads
    .filter((l) => l.agentId === session.agentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const convertedCount = leads.filter((l) => l.status === "converted").length;
  const pendingCount = leads.filter((l) => l.status === "new" || l.status === "read" || l.status === "contacted").length;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead ที่ฉันส่ง</h1>
          <p className="text-sm text-muted mt-0.5">{leads.length} รายการ · แปลงเป็นดีลแล้ว {convertedCount} รายการ</p>
        </div>
        <Link
          href="/leads/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
        >
          + ส่ง Lead ใหม่
        </Link>
      </div>

      {/* Summary */}
      {leads.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">ทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-800 tabular-nums">{leads.length}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">รอดำเนินการ</p>
            <p className="text-2xl font-bold text-amber-700 tabular-nums">{pendingCount}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">สำเร็จ</p>
            <p className="text-2xl font-bold text-green-700 tabular-nums">{convertedCount}</p>
          </div>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl px-4 py-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-muted text-sm mb-4">ยังไม่มี Lead ที่ส่งไป</p>
          <Link
            href="/leads/new"
            className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
          >
            ส่ง Lead แรก
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {leads.map((lead) => {
            const dealLink = lead.convertedDealId ? `/deals/${lead.convertedDealId}` : null;
            return (
              <div
                key={lead.id}
                className="bg-surface border border-border rounded-xl px-4 py-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {lead.customerName || "ไม่ระบุชื่อ"}
                        {lead.customerCompany && (
                          <span className="font-normal text-slate-500"> · {lead.customerCompany}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {lead.businessType && <>{lead.businessType} · </>}
                        ส่งเมื่อ {formatDate(lead.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </div>

                  {lead.workTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.workTypes.slice(0, 3).map((wt) => (
                        <span key={wt} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{wt}</span>
                      ))}
                    </div>
                  )}
                </div>

                {dealLink && (
                  <Link
                    href={dealLink}
                    className="shrink-0 text-xs font-medium text-green-700 hover:underline whitespace-nowrap"
                  >
                    ดูดีล →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
