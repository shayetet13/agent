import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { deleteAgent, approveAgent, rejectAgent } from "@/actions/agents";
import { DeleteButton } from "@/components/DeleteButton";
import { getSession } from "@/lib/session";

export default async function AgentsPage() {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  const data = await getData();

  const pendingAgents = data.agents.filter((a) => a.reviewStatus === "pending");
  const regularAgents = [...data.agents]
    .filter((a) => a.reviewStatus !== "pending")
    .sort((a, b) => a.name.localeCompare(b.name, "th"));

  const dealCountByAgent = data.deals.reduce<Record<string, number>>((acc, d) => {
    if (d.agentId) acc[d.agentId] = (acc[d.agentId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">นายหน้า ({data.agents.length})</h1>
        <Link href="/agents/new" className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          + เพิ่มนายหน้า
        </Link>
      </div>

      {/* นายหน้าลงทะเบียนใหม่รอดำเนินการ */}
      {pendingAgents.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 flex items-center gap-2">
            <span className="text-lg">🆕</span>
            <h2 className="font-semibold text-amber-900 text-sm">
              ลงทะเบียนใหม่ รอดำเนินการ ({pendingAgents.length})
            </h2>
          </div>
          <div className="divide-y divide-amber-100">
            {pendingAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/agents/${agent.id}`} className="font-semibold text-sm text-amber-900 hover:text-accent">
                      {agent.name}
                    </Link>
                    {agent.lineId && (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        LINE: {agent.lineId}
                      </span>
                    )}
                  </div>
                  {agent.phone && (
                    <p className="text-xs text-amber-700 mt-0.5">{agent.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={approveAgent}>
                    <input type="hidden" name="id" value={agent.id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
                    >
                      ตกลง
                    </button>
                  </form>
                  <form action={rejectAgent}>
                    <input type="hidden" name="id" value={agent.id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                    >
                      ไม่ตกลง
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* รายชื่อนายหน้าทั้งหมด */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {regularAgents.length === 0 ? (
          <p className="px-4 py-12 text-center text-muted text-sm">
            ยังไม่มีนายหน้า — <Link href="/agents/new" className="text-accent hover:underline">เพิ่มคนแรก</Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">เบอร์โทร</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">อีเมล</th>
                <th className="text-center px-4 py-2 font-medium">ดีล</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regularAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Link href={`/agents/${agent.id}`} className="hover:text-accent">{agent.name}</Link>
                      {agent.reviewStatus === "approved" && (
                        <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">
                          อนุมัติแล้ว
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{agent.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{agent.email || "—"}</td>
                  <td className="px-4 py-3 text-center">{dealCountByAgent[agent.id] ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/agents/${agent.id}/edit`} className="text-xs px-2 py-1 rounded border border-border hover:bg-slate-50 transition-colors">
                        แก้ไข
                      </Link>
                      <DeleteButton action={deleteAgent} id={agent.id} confirmTitle="ลบนายหน้า" confirmMessage={`ต้องการลบ "${agent.name}" ออกจากระบบ?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
