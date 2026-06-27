import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DealForm } from "@/components/DealForm";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  const { id } = await params;
  const data = await getData();
  const deal = data.deals.find((d) => d.id === id);
  if (!deal) notFound();

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <Link href={`/deals/${id}`} className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <h1 className="text-2xl font-bold">แก้ไขดีล — {deal.title}</h1>
      <div className="bg-surface border border-border rounded-xl p-5">
        <DealForm deal={deal} customers={data.customers} agents={data.agents} />
      </div>
    </div>
  );
}
