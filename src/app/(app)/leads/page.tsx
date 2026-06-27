import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/types";

export default async function LeadsPage() {
  const session = await getSession();
  if (session?.type !== "admin") redirect("/");

  const data = await getData();
  const agentMap = Object.fromEntries(data.agents.map((a) => [a.id, a.name]));

  const leads = [...data.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unreadCount = leads.filter((l) => l.status === "new").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
  const convertedCount = leads.filter((l) => l.status === "converted").length;
  const rejectedCount = leads.filter((l) => l.status === "rejected").length;
  const conversionRate = leads.length > 0 ? Math.round((convertedCount / leads.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Lead จากนายหน้า</h1>
          {unreadCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white animate-shake"
              style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-badge-pulse inline-block" />
              {unreadCount} รายการใหม่
            </span>
          )}
        </div>
        <span className="text-sm text-muted">{leads.length} รายการทั้งหมด</span>
      </div>

      {/* Funnel KPI */}
      {leads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "ใหม่", count: unreadCount, color: "bg-orange-50 border-orange-200 text-orange-700" },
            { label: "ติดต่อแล้ว", count: contactedCount, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
            { label: "แปลงเป็นดีล", count: convertedCount, color: "bg-green-50 border-green-200 text-green-700" },
            { label: "ไม่รับ", count: rejectedCount, color: "bg-red-50 border-red-200 text-red-600" },
            { label: "Conversion", count: `${conversionRate}%`, color: "bg-slate-50 border-slate-200 text-slate-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border px-3 py-2.5 flex flex-col gap-0.5 ${item.color}`}>
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{item.label}</span>
              <span className="text-xl font-bold tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl px-4 py-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-muted text-sm">ยังไม่มี Lead จากนายหน้า</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {leads.map((lead) => {
            const isNew = lead.status === "new";
            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="group bg-surface border rounded-xl px-4 py-4 flex items-center gap-4 hover:shadow-sm transition-all"
                style={{ borderColor: isNew ? "#ff6a1a44" : undefined }}
              >
                {/* Status dot */}
                <div className="shrink-0">
                  {isNew ? (
                    <div className="w-2.5 h-2.5 rounded-full animate-badge-pulse" style={{ background: "#ff6a1a" }} />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${isNew ? "text-slate-900" : "text-slate-700"}`}>
                        {lead.customerName || "ไม่ระบุชื่อ"}{" "}
                        {lead.customerCompany && <span className="font-normal text-slate-500">· {lead.customerCompany}</span>}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        นายหน้า: {agentMap[lead.agentId] ?? lead.brokerName ?? "—"}
                        {lead.businessType && <> · {lead.businessType}</>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isNew
                          ? "text-white"
                          : LEAD_STATUS_COLORS[lead.status]
                      }`}
                        style={isNew ? { background: "linear-gradient(90deg, #ff6a1a, #ff2e63)" } : undefined}
                      >
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                      <p className="text-xs text-muted">{formatDate(lead.createdAt)}</p>
                    </div>
                  </div>
                  {lead.workTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.workTypes.slice(0, 3).map((wt) => (
                        <span key={wt} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">{wt}</span>
                      ))}
                      {lead.workTypes.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px]">+{lead.workTypes.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
