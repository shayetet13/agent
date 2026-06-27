import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { QuotationForm } from "@/components/QuotationForm";
import Link from "next/link";

export default async function NewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.type !== "admin") redirect("/");

  const { id } = await params;
  const data = await getData();
  const customer = data.customers.find((c) => c.id === id);
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted mb-1">
          <Link href="/customers" className="hover:text-accent">ลูกค้า</Link>
          <span>/</span>
          <Link href={`/customers/${id}`} className="hover:text-accent">{customer.name}</Link>
          <span>/</span>
          <span>ใบเสนอราคาใหม่</span>
        </div>
        <h1 className="text-2xl font-bold">สร้างใบเสนอราคา</h1>
      </div>
      <QuotationForm customerId={id} customerName={customer.name} agents={data.agents} />
    </div>
  );
}
