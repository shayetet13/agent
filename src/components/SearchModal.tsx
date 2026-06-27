"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatBaht } from "@/lib/format";
import { DEAL_STATUS_LABELS } from "@/lib/types";

interface DealResult {
  id: string;
  title: string;
  customerName: string;
  status: string;
  quotedAmount: number;
}
interface CustomerResult { id: string; name: string; company: string; phone: string }
interface AgentResult    { id: string; name: string; phone: string }
interface ReceiptResult  { payoutId: string; receiptNo: string; agentName: string; dealTitle: string; amount: number }

interface SearchResults {
  deals: DealResult[];
  customers: CustomerResult[];
  agents: AgentResult[];
  receipts: ReceiptResult[];
  total: number;
}


export function SearchModal() {
  const [open, setOpen]       = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const openModal = () => {
    setOpen(true);
    setClosing(false);
    setQuery("");
    setResults(null);
  };

  const closeModal = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 200);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open && !closing) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open, closing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) { closeModal(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); if (open) closeModal(); else openModal(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closeModal]);

  // Search with debounce (timing matches real fetch duration)
  const doSearch = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (!q.trim()) { setResults(null); setLoading(false); return; }

    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: abortRef.current.signal,
      });
      const data: SearchResults = await res.json();
      setResults(data);
    } catch {
      // aborted — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 280);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  if (!open) {
    return (
      <button
        onClick={openModal}
        title="ค้นหา (Ctrl+K)"
        className="flex items-center gap-2 min-h-[44px] sm:min-h-0 sm:h-8 px-3 rounded-lg border border-slate-200 bg-white/80 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-white transition-all text-xs group touch-manipulation"
      >
        <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <span className="hidden sm:inline">ค้นหา…</span>
        <kbd className="hidden md:inline px-1.5 py-px text-[10px] font-mono bg-slate-100 text-slate-400 rounded border border-slate-200 leading-none">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        onClick={closeModal}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: `${closing ? "fade-out" : "fade-in"} 0.2s ease forwards` }}
      />

      {/* Modal panel */}
      <div className="relative z-10 flex justify-center pt-[8vh] px-4 pointer-events-none">
        <div
          className="w-full max-w-xl pointer-events-auto"
          style={{ animation: `${closing ? "modal-out" : "modal-in"} ${closing ? "0.18s" : "0.24s"} cubic-bezier(0.34,1.3,0.64,1) forwards` }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา ดีล ลูกค้า นายหน้า ราคา ค่าคอม เลขใบเสร็จ…"
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin shrink-0" />
              ) : (
                <button
                  onClick={closeModal}
                  className="shrink-0 text-xs text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  ESC
                </button>
              )}
            </div>

            {/* Thin separator */}
            <div className="h-px bg-slate-100" />

            {/* Body */}
            <div className="max-h-[62vh] overflow-y-auto overscroll-contain">

              {/* Hint state (no query yet) */}
              {!query && (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-slate-400 mb-3">ลองค้นหา…</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["ชื่อดีล", "ชื่อลูกค้า", "ชื่อนายหน้า", "RC202", "15000"].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => setQuery(hint)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs rounded-full transition-colors"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading skeletons — speed matches real fetch time */}
              {loading && query && (
                <div className="px-4 py-4 flex flex-col gap-4">
                  {[72, 60, 80, 55].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg animate-shimmer shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-3 animate-shimmer rounded" style={{ width: `${w}%` }} />
                        <div className="h-2.5 animate-shimmer rounded" style={{ width: `${w - 15}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {!loading && results?.total === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm text-slate-500">
                    ไม่พบผลลัพธ์สำหรับ &quot;<span className="font-semibold text-slate-700">{query}</span>&quot;
                  </p>
                </div>
              )}

              {/* Results */}
              {!loading && results && results.total > 0 && (
                <div className="py-1.5">
                  {/* Deals */}
                  {results.deals.length > 0 && (
                    <Section label="ดีล" icon="📋">
                      {results.deals.map((d, i) => (
                        <ResultRow key={d.id} href={`/deals/${d.id}`} onClose={closeModal} delay={i * 35}>
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {d.customerName} · {DEAL_STATUS_LABELS[d.status as keyof typeof DEAL_STATUS_LABELS] ?? d.status}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-slate-600 tabular-nums">
                              {formatBaht(d.quotedAmount)}
                            </span>
                          </div>
                        </ResultRow>
                      ))}
                    </Section>
                  )}

                  {/* Customers */}
                  {results.customers.length > 0 && (
                    <Section label="ลูกค้า" icon="👤">
                      {results.customers.map((c, i) => (
                        <ResultRow key={c.id} href={`/customers/${c.id}/edit`} onClose={closeModal} delay={i * 35}>
                          <p className="text-sm font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{[c.company, c.phone].filter(Boolean).join(" · ")}</p>
                        </ResultRow>
                      ))}
                    </Section>
                  )}

                  {/* Agents */}
                  {results.agents.length > 0 && (
                    <Section label="นายหน้า" icon="🤝">
                      {results.agents.map((a, i) => (
                        <ResultRow key={a.id} href={`/agents/${a.id}`} onClose={closeModal} delay={i * 35}>
                          <p className="text-sm font-medium text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-500">{a.phone}</p>
                        </ResultRow>
                      ))}
                    </Section>
                  )}

                  {/* Receipts */}
                  {results.receipts.length > 0 && (
                    <Section label="ใบเสร็จ" icon="🧾">
                      {results.receipts.map((r, i) => (
                        <ResultRow key={r.payoutId} href={`/receipt/${r.payoutId}`} onClose={closeModal} delay={i * 35} newTab>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-mono font-semibold text-indigo-700">{r.receiptNo}</p>
                              <p className="text-xs text-slate-500 truncate">{r.agentName} · {r.dealTitle}</p>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-slate-600 tabular-nums">
                              {formatBaht(r.amount)}
                            </span>
                          </div>
                        </ResultRow>
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {results && results.total > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">พบ {results.total} รายการ</span>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={closeModal}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  ดูผลทั้งหมด →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-0.5">
      <div className="px-4 py-1.5 flex items-center gap-1.5">
        <span className="text-xs leading-none">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  href, onClose, delay = 0, newTab, children,
}: {
  href: string; onClose: () => void; delay?: number; newTab?: boolean; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
      style={{ animation: `result-in 0.22s ease-out ${delay}ms both` }}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
