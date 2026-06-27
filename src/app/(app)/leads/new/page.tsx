import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { LeadForm } from "@/components/LeadForm";

export default async function LeadNewPage() {
  const session = await getSession();
  if (!session || session.type !== "broker") redirect("/");

  const data = await getData();
  const agent = data.agents.find((a) => a.id === session.agentId);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/leads/my" className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <LeadForm
        defaultBrokerName={agent?.name ?? ""}
        defaultBrokerPhone={agent?.phone ?? ""}
        defaultBrokerLine={agent?.lineId ?? ""}
      />
    </div>
  );
}
