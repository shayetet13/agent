import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { CustomerForm } from "@/components/CustomerForm";

export default async function NewCustomerPage() {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  return (
    <div className="flex flex-col gap-4">
      <Link href="/customers" className="text-sm text-muted hover:text-accent transition-colors inline-flex items-center gap-1">
        ← ย้อนกลับ
      </Link>
      <h1 className="text-2xl font-bold">เพิ่มลูกค้า</h1>
      <div className="bg-surface border border-border rounded-xl p-5">
        <CustomerForm />
      </div>
    </div>
  );
}
