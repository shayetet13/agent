import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CustomerForm } from "@/components/CustomerForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  const { id } = await params;
  const data = await getData();
  const customer = data.customers.find((c) => c.id === id);
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/customers/${id}`} className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <h1 className="text-2xl font-bold">แก้ไขลูกค้า — {customer.name}</h1>
      <div className="bg-surface border border-border rounded-xl p-5">
        <CustomerForm customer={customer} />
      </div>
    </div>
  );
}
