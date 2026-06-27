import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { AgentForm } from "@/components/AgentForm";
import { AgentCredentialForm } from "@/components/AgentCredentialForm";
import { getSession } from "@/lib/session";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");

  const { id } = await params;
  const data = await getData();
  const agent = data.agents.find((a) => a.id === id);
  if (!agent) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/agents/${id}`} className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <h1 className="text-2xl font-bold">แก้ไขนายหน้า — {agent.name}</h1>

      {/* ข้อมูลทั่วไป */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <AgentForm agent={agent} />
      </div>

      {/* ตั้งค่า Portal Login */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">ตั้งค่า Portal Login</h2>
          <p className="text-xs text-muted mt-0.5">ให้นายหน้า login เข้ามาดูงานของตัวเองได้</p>
        </div>
        <div className="p-5">
          <AgentCredentialForm agentId={agent.id} currentUsername={agent.username} />
        </div>
      </div>
    </div>
  );
}
