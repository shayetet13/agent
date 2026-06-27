import Link from "next/link";
import { redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { deleteCustomer } from "@/actions/customers";
import { DeleteButton } from "@/components/DeleteButton";
import { getSession } from "@/lib/session";

export default async function CustomersPage() {
  const session = await getSession();
  if (session?.type === "broker") redirect("/");
  const data = await getData();
  const customers = [...data.customers].sort((a, b) => a.name.localeCompare(b.name, "th"));

  const dealCountByCustomer = data.deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.customerId] = (acc[d.customerId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ลูกค้า ({customers.length})</h1>
        <Link href="/customers/new" className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          + เพิ่มลูกค้า
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {customers.length === 0 ? (
          <p className="px-4 py-12 text-center text-muted text-sm">
            ยังไม่มีลูกค้า — <Link href="/customers/new" className="text-accent hover:underline">เพิ่มคนแรก</Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">บริษัท</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">เบอร์โทร</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">แหล่งที่มา</th>
                <th className="text-center px-4 py-2 font-medium">ดีล</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/customers/${customer.id}`} className="hover:text-accent transition-colors">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{customer.company || "—"}</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted hidden lg:table-cell">{customer.source || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/deals?customerId=${customer.id}`} className="hover:text-accent">
                      {dealCountByCustomer[customer.id] ?? 0}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/customers/${customer.id}/edit`} className="text-xs px-2 py-1 rounded border border-border hover:bg-slate-50 transition-colors">
                        แก้ไข
                      </Link>
                      <DeleteButton action={deleteCustomer} id={customer.id} confirmTitle="ลบลูกค้า" confirmMessage={`ต้องการลบ "${customer.name}" ออกจากระบบ?`} />
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
