import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ModalProvider } from "@/components/ConfirmModal";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getSession } from "@/lib/session";
import { getData } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, data] = await Promise.all([getSession(), getData()]);
  if (!session) redirect("/login");

  let agentName: string | undefined;
  let unreadLeadsCount = 0;

  if (session?.type === "broker" && session.agentId) {
    agentName = data.agents.find((a) => a.id === session.agentId)?.name;
  }
  if (session?.type === "admin") {
    unreadLeadsCount = data.leads.filter((l) => l.status === "new").length;
  }

  return (
    <ModalProvider>
      <Nav userType={session.type} agentName={agentName} unreadLeadsCount={unreadLeadsCount} />
      <AutoRefresh />
      <main className="flex-1 container mx-auto max-w-6xl px-4 pt-20 pb-24 sm:pb-6">{children}</main>
    </ModalProvider>
  );
}
