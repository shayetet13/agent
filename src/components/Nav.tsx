"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/app/login/action";
import { SearchModal } from "@/components/SearchModal";

// ── Icons for bottom tab bar ─────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-accent" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconBriefcase({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-accent" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function IconUsers({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-accent" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconMoney({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-accent" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconInbox({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-accent" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}
function IconPlus({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-accent" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

// ── Desktop links ─────────────────────────────────────────────────────────────
const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "ภาพรวม" },
  { href: "/deals", label: "ดีล" },
  { href: "/customers", label: "ลูกค้า" },
  { href: "/agents", label: "นายหน้า" },
  { href: "/payouts", label: "ค่าคอม" },
  { href: "/leads", label: "Leads" },
];
const brokerLinks = [
  { href: "/", label: "ภาพรวม" },
  { href: "/deals", label: "ดีลของฉัน" },
  { href: "/payouts", label: "ค่าคอม" },
  { href: "/leads/new", label: "ส่งลีด +" },
];

// ── Mobile bottom tabs ────────────────────────────────────────────────────────
type TabItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: number;
  isLogout?: boolean;
};

function buildAdminTabs(unreadLeadsCount: number): TabItem[] {
  return [
    { href: "/", label: "ภาพรวม", icon: (a) => <IconHome active={a} /> },
    { href: "/deals", label: "ดีล", icon: (a) => <IconBriefcase active={a} /> },
    { href: "/customers", label: "ลูกค้า", icon: (a) => <IconUsers active={a} /> },
    { href: "/payouts", label: "ค่าคอม", icon: (a) => <IconMoney active={a} /> },
    { href: "/leads", label: "Leads", icon: (a) => <IconInbox active={a} />, badge: unreadLeadsCount },
  ];
}

function buildBrokerTabs(): TabItem[] {
  return [
    { href: "/", label: "ภาพรวม", icon: (a) => <IconHome active={a} /> },
    { href: "/deals", label: "ดีลของฉัน", icon: (a) => <IconBriefcase active={a} /> },
    { href: "/payouts", label: "ค่าคอม", icon: (a) => <IconMoney active={a} /> },
    { href: "/leads/new", label: "ส่งลีด", icon: (a) => <IconPlus active={a} /> },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Nav({
  userType = "admin",
  agentName,
  unreadLeadsCount = 0,
}: {
  userType?: "admin" | "broker";
  agentName?: string;
  unreadLeadsCount?: number;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const links = userType === "broker" ? brokerLinks : adminLinks;
  const mobileTabs = userType === "broker" ? buildBrokerTabs() : buildAdminTabs(unreadLeadsCount);

  function handleLogout() {
    startTransition(() => logoutAction());
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <header className="bg-surface border-b border-border fixed top-0 left-0 right-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">

          {/* Brand */}
          <Link href="/" className="font-semibold text-accent text-sm tracking-tight shrink-0">
            🏢 <span className="hidden sm:inline">{userType === "broker" ? (agentName ?? "Portal") : "ระบบนายหน้า"}</span>
            <span className="sm:hidden">{userType === "broker" ? "Portal" : "นายหน้า"}</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden sm:flex gap-1 flex-1 pt-2 pb-1 pr-1">
            {links.map(({ href, label }) => {
              const active = isActive(href);
              const showBadge = href === "/leads" && unreadLeadsCount > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-accent text-white" : "text-muted hover:text-foreground hover:bg-slate-100"
                  }`}
                >
                  {label}
                  {showBadge && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
                      style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
                    >
                      {unreadLeadsCount > 9 ? "9+" : unreadLeadsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto sm:ml-0 flex items-center gap-2">
            <SearchModal />

            {/* Mobile: agent name chip */}
            {userType === "broker" && agentName && (
              <span className="sm:hidden text-xs text-muted bg-slate-100 px-2 py-1 rounded-full truncate max-w-[100px]">
                {agentName}
              </span>
            )}

            {/* Desktop agent name */}
            {userType === "broker" && agentName && (
              <span className="hidden sm:inline shrink-0 text-xs text-muted">👤 {agentName}</span>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={pending}
              title="ออกจากระบบ"
              className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-md text-xs font-medium text-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors touch-manipulation"
            >
              <IconLogout />
              <span className="hidden sm:inline">{pending ? "…" : "ออกจากระบบ"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {mobileTabs.map(({ href, label, icon, badge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-w-0 min-h-[52px] transition-colors touch-manipulation ${
                  active ? "text-accent" : "text-zinc-400"
                }`}
              >
                <span className="relative">
                  {icon(active)}
                  {(badge ?? 0) > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white animate-badge-pulse"
                      style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
                    >
                      {(badge ?? 0) > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-medium truncate w-full text-center leading-tight ${
                  active ? "text-accent" : "text-zinc-400"
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
