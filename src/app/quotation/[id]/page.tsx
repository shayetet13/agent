import { notFound, redirect } from "next/navigation";
import { getData } from "@/lib/db";
import { getSession } from "@/lib/session";
import { QuotationActions } from "@/components/QuotationActions";
import { QuotationFrame } from "@/components/QuotationFrame";
import { formatDecimal, formatDateLong } from "@/lib/format";
import { COMPANY } from "@/lib/constants";
import type { QuotationItem } from "@/lib/types";

const ACCENT  = "#0a2540";
const ACCENT2 = "#00d4a8";
const GOLD    = "#d4a574";
const INK     = "#0f1419";
const MUTED   = "#6b7785";
const LINE    = "#e5e9ef";
const BGSOFT  = "#f6f8fb";
const WARN    = "#ff5a5f";

const ISSUER = {
  ...COMPANY,
  subname:  "สแตคก้าเซเว่น",
  tagline: "เขียน Program · Web App · Website · LINE OA · Chatbot · Telegram Bot",
  address: "กรุงเทพมหานคร",
  taxId:   "xxxx-xxxx-xxxxx",
  phone:   "09x-xxx-xxxx",
  logo:    "S7",
  devTitle: "Authorized Signature · ผู้มีอำนาจลงนาม",
};

const TERMS = [
  "ใบเสนอราคานี้มีอายุตามที่ระบุ นับจากวันที่ออกเอกสาร หากพ้นกำหนดราคาอาจมีการเปลี่ยนแปลง",
  "การเปลี่ยนแปลงหรือเพิ่มขอบเขตงานหลังอนุมัติโครงการ อาจมีค่าใช้จ่ายเพิ่มเติม โดยแจ้งและได้รับอนุมัติก่อนดำเนินการ",
  "ส่งมอบงานตามขอบเขตที่ระบุไว้ในใบเสนอราคานี้เท่านั้น",
  "ผู้ว่าจ้างเป็นเจ้าของข้อมูล เนื้อหา และข้อมูลทางธุรกิจทั้งหมดที่ใช้ในโครงการ",
  "ผู้พัฒนาเป็นเจ้าขององค์ความรู้ เครื่องมือ ไลบรารี และโครงสร้างการพัฒนาที่ใช้ในการดำเนินงาน",
  "รับประกันแก้ไขข้อผิดพลาด (Bug) ที่เกิดจากการพัฒนาระบบ เป็นระยะเวลา 30 วัน หลังการส่งมอบงาน",
];

// ── HEIGHT ESTIMATES (px at 96 dpi A4 = 794×1122) ─────────────────────────
const PAGE_H    = 1122;
const PAD_V     = 76;    // content padding: top 40 + bottom 36
const HDR1_H    = 372;   // page-1 full header (logo+title+divider+parties+meta+project)
const HDRC_H    = 78;    // compact header (pages 2+)
const TBL_HEAD  = 38;    // table <thead> row
const SAFETY    = 42;    // safety buffer per page (กัน overflow:hidden ตัดเนื้อหา)
const ROW_VPAD  = 16;    // <td> vertical padding per item block (8+8)
const BOTTOM_H  = 410;   // totals + terms + signatures + footer (last page)
const LINE_H    = 17;    // 1 wrapped description line (10.5px × 1.6 ≈ 16.8)
const CHARS_PER_LINE = 54;

/** หนึ่งบล็อก = ส่วนของ 1 รายการที่อยู่ในหน้าเดียว (รายการยาวถูกแบ่งได้หลายบล็อก) */
interface ItemBlock {
  item: QuotationItem;
  itemNo: number;     // เลขรายการ 1-based (global)
  lines: string[];    // บรรทัด description เฉพาะส่วนที่อยู่หน้านี้
  isStart: boolean;   // true = บล็อกแรกของรายการ (โชว์เลข + qty/price/amount)
}

function lineHeight(line: string): number {
  const t = line.trimStart();
  if (!t) return 5;
  if (t.startsWith("## ")) return LINE_H + 5;
  const content = t.startsWith("- ") || t.startsWith("• ") ? t.slice(2) : t;
  return Math.max(LINE_H, Math.ceil(content.length / CHARS_PER_LINE) * LINE_H);
}

const pageCap = (pageIdx: number) =>
  PAGE_H - PAD_V - (pageIdx === 0 ? HDR1_H : HDRC_H) - TBL_HEAD - SAFETY;

/** แบ่งรายการเป็นหน้าๆ ระดับบรรทัด — รายการเดียวที่ยาวมากก็ถูกแบ่งข้ามหน้าได้ */
function paginate(items: QuotationItem[]): ItemBlock[][] {
  const pages: ItemBlock[][] = [];
  let cur: ItemBlock[] = [];
  let used = 0;
  let pageIdx = 0;

  const newPage = () => {
    pages.push(cur);
    cur = [];
    used = 0;
    pageIdx++;
  };

  items.forEach((item, idx) => {
    const itemNo = idx + 1;
    const lines = item.description.length ? item.description.split("\n") : [""];
    let seg: string[] = [];
    let isStart = true;

    const flushSeg = () => {
      if (seg.length === 0) return;
      cur.push({ item, itemNo, lines: seg, isStart });
      seg = [];
      isStart = false;
    };

    for (const ln of lines) {
      const lh = lineHeight(ln);
      const startingBlock = seg.length === 0;
      const add = lh + (startingBlock ? ROW_VPAD : 0);
      // ขึ้นหน้าใหม่ถ้าเกิน cap และหน้านี้มีเนื้อหาอยู่แล้ว (หรือกำลังกลางบล็อก)
      if (used + add > pageCap(pageIdx) && (cur.length > 0 || !startingBlock)) {
        flushSeg();
        newPage();
        seg.push(ln);
        used += lh + ROW_VPAD;
        continue;
      }
      seg.push(ln);
      used += add;
    }
    flushSeg();
  });

  // กันส่วนท้าย (totals/terms/sigs/footer) ล้น — ถ้าไม่พอให้ดันลงหน้าใหม่
  if (used + BOTTOM_H > pageCap(pageIdx) && cur.length > 0) {
    newPage();
  }
  pages.push(cur);
  return pages;
}

function renderLines(lines: string[]) {
  return (
    <div style={{ fontSize: 10.5, color: "#555", lineHeight: 1.6, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>
      {lines.map((line, i) => {
        const t = line.trimStart();
        if (!t) return <div key={i} style={{ height: 4 }} />;
        if (t.startsWith("## "))
          return <div key={i} style={{ fontWeight: 700, color: ACCENT, marginTop: i > 0 ? 5 : 0, marginBottom: 1 }}>{t.slice(3)}</div>;
        if (t.startsWith("- ") || t.startsWith("• "))
          return (
            <div key={i} style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
              <span style={{ color: ACCENT2, fontWeight: 700, flexShrink: 0, lineHeight: "15px" }}>·</span>
              <span>{t.slice(2)}</span>
            </div>
          );
        return <div key={i}>{t}</div>;
      })}
    </div>
  );
}

function ItemsTableHead() {
  return (
    <thead>
      <tr>
        {(["#", "Description · รายการ", "Qty", "Unit Price", "Amount"] as const).map((h, i) => (
          <th key={h} style={{
            background: ACCENT, color: "#fff",
            padding: "7px 10px", fontSize: 11, fontWeight: 600,
            letterSpacing: 1.2, textTransform: "uppercase",
            textAlign: i === 0 ? "center" : i === 1 ? "left" : "right",
            width: i === 0 ? 38 : i === 2 ? 60 : i === 3 ? 100 : 110,
            borderRadius: i === 0 ? "6px 0 0 6px" : i === 4 ? "0 6px 6px 0" : undefined,
          }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default async function QuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session] = await Promise.all([getData(), getSession()]);
  if (!session) redirect("/login");

  const q = data.quotations.find((x) => x.id === id);
  if (!q) notFound();
  const isAdmin = session.type === "admin";

  const customer   = data.customers.find((c) => c.id === q.customerId);
  const subtotal   = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const tax        = subtotal * (q.taxPercent / 100);
  const total      = subtotal + tax;
  const validUntil = new Date(new Date(q.createdAt).getTime() + q.validDays * 86_400_000).toISOString();

  const pages      = paginate(q.items);
  const totalPages = pages.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #d9dee6; -webkit-font-smoothing: antialiased; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          #quotation-outer { padding: 0 !important; display: block !important; gap: 0 !important; }
          .q-sheet { box-shadow: none !important; margin: 0 !important; overflow: hidden !important; border-left: 7px solid #0a2540 !important; width: 210mm !important; height: 297mm !important; }
          .q-sheet:not(:last-child) { page-break-after: always; break-after: page; }
          .q-left-bar, .q-glow { display: none !important; }
          .q-row { break-inside: avoid; page-break-inside: avoid; }
          table.items-table { page-break-inside: auto; }
        }
      `}</style>

      <QuotationActions dealId={q.dealId ?? null} quotationNumber={q.number} canDelete={isAdmin} />

      <div id="quotation-outer" style={{ minHeight: "100vh", paddingTop: 72, paddingBottom: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <QuotationFrame>
          {pages.map((pageBlocks, pageIdx) => {
            const isFirst = pageIdx === 0;
            const isLast  = pageIdx === totalPages - 1;

            return (
              <div key={pageIdx} className="q-sheet" style={{
                position: "relative",
                background: "#fff",
                fontFamily: "'Inter','Noto Sans Thai',sans-serif",
                color: INK,
                boxShadow: "0 30px 80px rgba(15,20,25,0.18), 0 6px 18px rgba(15,20,25,0.08)",
                overflow: "hidden",
                marginBottom: isLast ? 0 : 32,
              }}>

                {/* Left accent bar */}
                <div className="q-left-bar" style={{
                  position: "absolute", top: 0, left: 0,
                  width: 7, height: "100%",
                  background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                }} />

                {/* Top-right glow — page 1 only */}
                {isFirst && (
                  <div className="q-glow" style={{
                    position: "absolute", top: -90, right: -90,
                    width: 260, height: 260,
                    background: `radial-gradient(circle, rgba(0,212,168,0.10) 0%, rgba(0,212,168,0) 70%)`,
                    borderRadius: "50%", zIndex: 0,
                  }} />
                )}

                {/* ── Sheet inner (A4: 794×1122px = 210×296.9mm, น้อยกว่า 297 กันล้นหน้า) ── */}
                <div style={{
                  position: "relative", zIndex: 1,
                  padding: "40px 48px 36px 54px",
                  display: "flex", flexDirection: "column",
                  height: 1122,
                }}>

                  {isFirst ? (
                    /* ── FULL HEADER (page 1) ────────────────────────── */
                    <>
                      <div className="q-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/logo-stacka7.png" alt={ISSUER.name} style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: ACCENT, letterSpacing: -0.5, lineHeight: 1.1 }}>
                              {ISSUER.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>
                              {ISSUER.tagline}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 34, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1 }}>
                            QUOTATION<span style={{ color: ACCENT2 }}>.</span>
                          </div>
                          <div style={{ fontFamily: "'Noto Sans Thai',sans-serif", fontSize: 12, color: "#2a3441", fontWeight: 500, marginTop: 3 }}>ใบเสนอราคา</div>
                          <div style={{ marginTop: 6, fontSize: 10, color: MUTED, letterSpacing: 1 }}>
                            NO. <strong style={{ color: INK, fontWeight: 600 }}>{q.number}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ height: 1, background: `linear-gradient(90deg, ${LINE} 0%, transparent 100%)`, margin: "0 0 18px" }} />

                      <div className="q-parties" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, marginBottom: 18 }}>
                        <div>
                          <div style={{ fontSize: 10, letterSpacing: 2.2, textTransform: "uppercase", color: ACCENT2, fontWeight: 600, marginBottom: 4 }}>From · ผู้เสนอราคา</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 3 }}>{ISSUER.subname}</div>
                          <div style={{ fontSize: 10.5, color: "#2a3441", lineHeight: 1.6 }}>
                            <div>{ISSUER.address}</div>
                            <div><span style={{ display: "inline-block", width: 60, color: MUTED, fontSize: 10 }}>Tax ID</span>{ISSUER.taxId}</div>
                            <div><span style={{ display: "inline-block", width: 60, color: MUTED, fontSize: 10 }}>Tel</span>{ISSUER.phone} · <span style={{ color: MUTED, fontSize: 10 }}>Email</span> {ISSUER.email}</div>
                            <div><span style={{ display: "inline-block", width: 60, color: MUTED, fontSize: 10 }}>Web</span>{ISSUER.website}</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, letterSpacing: 2.2, textTransform: "uppercase", color: ACCENT2, fontWeight: 600, marginBottom: 4 }}>To · ลูกค้า</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 3 }}>{customer?.name ?? "—"}</div>
                          <div style={{ fontSize: 10.5, color: "#2a3441", lineHeight: 1.6 }}>
                            {customer?.company && <div>{customer.company}</div>}
                            {customer?.phone  && <div><span style={{ display: "inline-block", width: 60, color: MUTED, fontSize: 10 }}>Tel</span>{customer.phone}</div>}
                            {customer?.email  && <div><span style={{ display: "inline-block", width: 60, color: MUTED, fontSize: 10 }}>Email</span>{customer.email}</div>}
                          </div>
                        </div>
                      </div>

                      <div className="q-meta" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
                        {[
                          { label: "Issue Date",   val: formatDateLong(q.createdAt), color: ACCENT },
                          { label: "Valid Until",  val: formatDateLong(validUntil),  color: ACCENT2 },
                          { label: "Payment Term", val: "แบ่ง 4 งวด",               color: GOLD },
                        ].map(({ label, val, color }) => (
                          <div key={label} style={{ background: BGSOFT, borderLeft: `3px solid ${color}`, padding: "7px 12px", borderRadius: "0 6px 6px 0" }}>
                            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: MUTED, fontWeight: 600 }}>{label}</div>
                            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: INK, marginTop: 1 }}>{val}</div>
                          </div>
                        ))}
                      </div>

                      <div className="q-title" style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>โครงการ / Project</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>{q.title}</div>
                      </div>
                    </>
                  ) : (
                    /* ── COMPACT HEADER (pages 2+) ──────────────────── */
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: `1.5px solid ${LINE}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-stacka7.png" alt={ISSUER.name} style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>{ISSUER.name}</div>
                          <div style={{ fontSize: 9, color: MUTED, marginTop: 2, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>{ISSUER.subname}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: INK }}>
                          QUOTATION<span style={{ color: ACCENT2 }}>.</span>
                          <span style={{ fontWeight: 500, color: MUTED, marginLeft: 6, fontSize: 10, letterSpacing: 0.5 }}>{q.number}</span>
                        </div>
                        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 3, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: 1.2 }}>
                          PAGE {String(pageIdx + 1).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── ITEMS TABLE ─────────────────────────────────── */}
                  {pageBlocks.length > 0 && (
                    <table className="items-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: isLast ? 14 : 0, fontSize: 10.5 }}>
                      <ItemsTableHead />
                      <tbody>
                        {pageBlocks.map((b, i) => (
                          <tr key={i} className="q-row">
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "center", verticalAlign: "top" }}>
                              {b.isStart ? (
                                <span style={{ fontFamily: "'Space Grotesk',sans-serif", color: ACCENT2, fontWeight: 600, fontSize: 11 }}>
                                  {String(b.itemNo).padStart(2, "0")}
                                </span>
                              ) : (
                                <span style={{ color: MUTED, fontSize: 11 }}>↳</span>
                              )}
                            </td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, verticalAlign: "top" }}>
                              {!b.isStart && (
                                <div style={{ fontSize: 9, color: MUTED, fontStyle: "italic", marginBottom: 2, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>
                                  (ต่อจากหน้าก่อน)
                                </div>
                              )}
                              {renderLines(b.lines)}
                            </td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                              {b.isStart ? b.item.qty.toLocaleString("th-TH") : ""}
                            </td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                              {b.isStart ? formatDecimal(b.item.unitPrice) : ""}
                            </td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}`, textAlign: "right", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                              {b.isStart ? formatDecimal(b.item.qty * b.item.unitPrice) : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* ── BOTTOM SECTIONS — last page only ────────────── */}
                  {isLast && (
                    <>
                      {/* TOTALS */}
                      <div className="q-totals" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                        <div style={{ width: "52%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, color: "#2a3441", borderBottom: `1px dashed ${LINE}` }}>
                            <span>Subtotal</span>
                            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatDecimal(subtotal)}</span>
                          </div>
                          {q.taxPercent > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, color: "#2a3441", borderBottom: `1px dashed ${LINE}` }}>
                              <span>VAT {q.taxPercent}%</span>
                              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>+ {formatDecimal(tax)}</span>
                            </div>
                          )}
                          <div style={{
                            marginTop: 3, background: ACCENT, color: "#fff",
                            padding: "10px 14px", borderRadius: 6,
                            display: "flex", justifyContent: "space-between", alignItems: "baseline",
                          }}>
                            <div style={{ fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", opacity: 0.8 }}>Grand Total</div>
                            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>
                              {formatDecimal(total)} <small style={{ fontSize: 10, opacity: 0.8, fontWeight: 500 }}>THB</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* TERMS & CONDITIONS */}
                      <div className="q-terms" style={{ background: BGSOFT, borderRadius: 8, padding: "8px 14px 10px", flexShrink: 0 }}>
                        <div style={{ fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 6 }}>
                          Terms &amp; Conditions · เงื่อนไขการให้บริการ
                        </div>
                        {/* note chips */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 7 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,90,95,0.08)", border: "1px solid rgba(255,90,95,0.25)", borderRadius: 4, padding: "3px 10px" }}>
                            <div style={{ width: 5, height: 5, background: WARN, borderRadius: "50%", flexShrink: 0 }} />
                            <span style={{ fontSize: 10.5, color: WARN, fontWeight: 600, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>
                              หมายเหตุ: ชำระเงินงวดแรกสำเร็จถึงจะเริ่มงานได้
                            </span>
                          </div>
                          {q.excludeHosting && (
                            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(212,165,116,0.10)", border: "1px solid rgba(212,165,116,0.40)", borderRadius: 4, padding: "3px 10px" }}>
                              <div style={{ width: 5, height: 5, background: GOLD, borderRadius: "50%", flexShrink: 0 }} />
                              <span style={{ fontSize: 10.5, color: "#9a6a2e", fontWeight: 600, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>
                                ราคานี้ไม่รวมค่าจดทะเบียนโดเมนและ Hosting (ชำระแยกตามที่ Provider กำหนด)
                              </span>
                            </div>
                          )}
                        </div>
                        {/* payment chips */}
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                          {[
                            { label: "งวด 1 · 40%", sub: "ก่อนเริ่มงาน" },
                            { label: "งวด 2 · 30%", sub: "ตามความคืบหน้า" },
                            { label: "งวด 3 · 20%", sub: "ส่งมอบทดสอบ" },
                            { label: "งวด 4 · 10%", sub: "ปิดโครงการ" },
                          ].map((p) => (
                            <div key={p.label} style={{ background: ACCENT, color: "#fff", padding: "3px 8px", borderRadius: 3, fontSize: 11, lineHeight: 1.4 }}>
                              <div style={{ fontWeight: 700 }}>{p.label}</div>
                              <div style={{ opacity: 0.7, fontSize: 9 }}>{p.sub}</div>
                            </div>
                          ))}
                        </div>
                        {/* 2-column bullets */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                          {[TERMS.slice(0, 3), TERMS.slice(3)].map((col, ci) => (
                            <ul key={ci} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                              {col.map((t) => (
                                <li key={t} style={{ fontSize: 10, color: "#2a3441", lineHeight: 1.5, paddingLeft: 10, position: "relative", marginBottom: 3, fontFamily: "'Noto Sans Thai','Inter',sans-serif" }}>
                                  <span style={{ position: "absolute", left: 0, top: 6, width: 4, height: 4, background: ACCENT2, borderRadius: "50%", display: "block" }} />
                                  {t}
                                </li>
                              ))}
                            </ul>
                          ))}
                        </div>
                        {q.notes && (
                          <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${LINE}`, fontSize: 10, color: MUTED, fontFamily: "'Noto Sans Thai','Inter',sans-serif", whiteSpace: "pre-wrap" }}>
                            <strong style={{ color: INK }}>หมายเหตุเพิ่มเติม:</strong> {q.notes}
                          </div>
                        )}
                      </div>

                      {/* SIGNATURES */}
                      <div className="q-sigs" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: "auto", paddingTop: 16 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ height: 64, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/sing.png" alt="ลายเซ็น" style={{ height: 58, objectFit: "contain" }} />
                          </div>
                          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>
                            วันที่ / Date <span style={{ display: "inline-block", borderBottom: `1.5px solid ${INK}`, minWidth: 110, padding: "0 6px 2px", color: INK, fontWeight: 500 }}>
                              {formatDateLong(q.createdAt)}
                            </span>
                          </div>
                          <div style={{ borderTop: `1.5px solid ${INK}`, paddingTop: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: INK }}>( {ISSUER.dev} )</div>
                            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{ISSUER.devTitle}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ height: 64, marginBottom: 4 }} />
                          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>
                            วันที่ / Date <span style={{ display: "inline-block", borderBottom: `1.5px solid ${INK}`, minWidth: 110, padding: "0 6px 2px", color: INK, fontWeight: 500 }}>
                              &nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;
                            </span>
                          </div>
                          <div style={{ borderTop: `1.5px solid ${INK}`, paddingTop: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: INK }}>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
                            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Customer Signature · ผู้อนุมัติ</div>
                          </div>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div className="q-footer" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 12, fontSize: 10.5, color: MUTED }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/id%20line%20kao.jpg" alt="LINE QR" style={{ width: 90, height: 90, objectFit: "contain", flexShrink: 0, borderRadius: 4 }} />
                        <div style={{ flex: 1, textAlign: "center", lineHeight: 1.65, fontFamily: "'Noto Sans Thai','Inter',sans-serif", fontSize: 10, color: MUTED }}>
                          ออกแบบและพัฒนา Web Application ตามความต้องการของลูกค้า โดยเน้นมาตรฐานการพัฒนาซอฟต์แวร์<br />
                          ประสิทธิภาพการใช้งาน ความปลอดภัยของข้อมูล และความพร้อมในการต่อยอดระบบในอนาคต
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", letterSpacing: 1, fontSize: 10.5, flexShrink: 0 }}>
                          PAGE {String(totalPages).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                        </div>
                      </div>
                    </>
                  )}

                </div>{/* end sheet inner */}
              </div>
            );
          })}
        </QuotationFrame>
      </div>
    </>
  );
}
