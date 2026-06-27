"use client";

import { useRouter } from "next/navigation";

type View = "day" | "month" | "year";

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function addMonths(monthStr: string, n: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addYears(yearStr: string, n: number): string {
  return String(Number(yearStr) + n);
}

function prevNext(view: View, date: string): { prev: string; next: string } {
  if (view === "day") return { prev: addDays(date, -1), next: addDays(date, 1) };
  if (view === "month") return { prev: addMonths(date, -1), next: addMonths(date, 1) };
  return { prev: addYears(date, -1), next: addYears(date, 1) };
}

export function todayValue(view: View): string {
  const now = new Date();
  if (view === "day") return now.toISOString().slice(0, 10);
  if (view === "month") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return String(now.getFullYear());
}

interface Props {
  view: View;
  date: string;
  label: string;
}

export function PeriodNav({ view, date, label }: Props) {
  const router = useRouter();
  const { prev, next } = prevNext(view, date);
  const today = todayValue(view);
  const isToday = date === today;

  const navViews: { key: View; label: string }[] = [
    { key: "day", label: "วัน" },
    { key: "month", label: "เดือน" },
    { key: "year", label: "ปี" },
  ];

  function go(v: View, d: string) {
    router.push(`/dashboard?view=${v}&date=${d}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* View tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {navViews.map(({ key, label: l }) => (
          <button
            key={key}
            onClick={() => go(key, todayValue(key))}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === key ? "bg-accent text-white" : "bg-surface text-muted hover:bg-slate-100"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(view, prev)}
          className="p-1.5 rounded-lg border border-border hover:bg-slate-100 transition-colors text-muted"
          aria-label="ก่อนหน้า"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold min-w-[130px] text-center px-1">{label}</span>
        <button
          onClick={() => go(view, next)}
          className="p-1.5 rounded-lg border border-border hover:bg-slate-100 transition-colors text-muted"
          aria-label="ถัดไป"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => go(view, today)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-accent text-accent hover:bg-indigo-50 transition-colors"
        >
          ปัจจุบัน
        </button>
      )}
    </div>
  );
}
