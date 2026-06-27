import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { DealForm } from "@/components/DealForm";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  const sp = await searchParams;
  const data = await getData();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/deals" className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <h1 className="text-2xl font-bold">สร้างดีลใหม่</h1>
      <div className="bg-surface border border-border rounded-xl p-5">
        <DealForm customers={data.customers} agents={data.agents} defaultCustomerId={sp.customerId} />
      </div>
    </div>
  );
}
