"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteQuotation } from "@/actions/quotations";

const BTN_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 38,
  padding: "0 18px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  outline: "none",
  transition: "opacity 0.15s",
  whiteSpace: "nowrap",
};

export function QuotationActions({
  dealId,
  quotationNumber,
  canDelete = true,
}: {
  dealId?: string | null;
  quotationNumber?: string;
  canDelete?: boolean;
}) {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  const [downloading, setDownloading] = useState(false);

  function handleBack() {
    router.push(dealId ? `/deals/${dealId}` : "/deals");
  }

  async function handleDelete() {
    if (!confirm("ต้องการลบใบเสนอราคานี้?\n\nไม่สามารถกู้คืนได้")) return;
    const fd = new FormData();
    fd.set("id", quotationId);
    try {
      await deleteQuotation(fd);
      router.push(dealId ? `/deals/${dealId}` : "/deals");
    } catch {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  }

  async function handleDownload() {
    // ใบเสนอราคามีหลายหน้า — แต่ละหน้าคือ .q-sheet card หนึ่งใบ
    const sheets = Array.from(document.querySelectorAll<HTMLElement>(".q-sheet"));
    if (sheets.length === 0) {
      alert("ไม่พบเอกสารสำหรับสร้าง PDF");
      return;
    }
    setDownloading(true);

    // ปิด zoom ของ QuotationFrame ชั่วคราวเพื่อให้ capture ที่ขนาดจริง
    const frame = sheets[0].parentElement as HTMLElement | null;
    const prevZoom = frame?.style.zoom ?? "";
    if (frame) frame.style.zoom = "1";

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const A4_W = 210;
      const A4_H = 297;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // capture ทุกหน้าพร้อมกัน — sheets เป็น sibling ไม่ nested จึง parallel-safe
      const canvases = await Promise.all(
        sheets.map((sheet) =>
          html2canvas(sheet, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: sheet.offsetWidth,
            height: sheet.offsetHeight,
          })
        )
      );
      canvases.forEach((canvas, i) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, A4_W, A4_H);
      });

      pdf.save(`${quotationNumber ?? "quotation"}.pdf`);
    } catch {
      alert("ไม่สามารถสร้าง PDF ได้");
    } finally {
      if (frame) frame.style.zoom = prevZoom;
      setDownloading(false);
    }
  }

  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 56,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        gap: 12,
      }}
    >
      {/* ← กลับ */}
      <button
        onClick={handleBack}
        style={{
          ...BTN_BASE,
          background: "none",
          color: "#64748b",
          padding: "0 8px",
          fontWeight: 500,
        }}
        onMouseOver={e => (e.currentTarget.style.color = "#1e293b")}
        onMouseOut={e => (e.currentTarget.style.color = "#64748b")}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        กลับ
      </button>

      {/* Right group */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* ลบ — admin เท่านั้น */}
        {canDelete && (
          <button
            onClick={handleDelete}
            style={{ ...BTN_BASE, background: "#fff1f2", color: "#dc2626", border: "1px solid #fca5a5" }}
            onMouseOver={e => (e.currentTarget.style.background = "#ffe4e6")}
            onMouseOut={e => (e.currentTarget.style.background = "#fff1f2")}
          >
            ลบ
          </button>
        )}

        {/* ตกลง */}
        <button
          onClick={handleBack}
          style={{ ...BTN_BASE, background: "#0a2540", color: "#ffffff" }}
          onMouseOver={e => (e.currentTarget.style.background = "#0d2f52")}
          onMouseOut={e => (e.currentTarget.style.background = "#0a2540")}
        >
          ตกลง
        </button>

        {/* divider */}
        <div style={{ width: 1, height: 28, background: "#e2e8f0", margin: "0 4px" }} />

        {/* ดาวน์โหลด PDF */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            ...BTN_BASE,
            background: downloading ? "#99e8d8" : "#00d4a8",
            color: "#0a2540",
            opacity: downloading ? 0.7 : 1,
            cursor: downloading ? "wait" : "pointer",
          }}
          onMouseOver={e => { if (!downloading) e.currentTarget.style.background = "#00bfa0"; }}
          onMouseOut={e => { if (!downloading) e.currentTarget.style.background = "#00d4a8"; }}
        >
          {downloading ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              style={{ animation: "spin 1s linear infinite" }}>
              <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {downloading ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
        </button>

        {/* ปริ้น */}
        <button
          onClick={() => window.print()}
          style={{ ...BTN_BASE, background: "#334155", color: "#ffffff" }}
          onMouseOver={e => (e.currentTarget.style.background = "#1e293b")}
          onMouseOut={e => (e.currentTarget.style.background = "#334155")}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
          </svg>
          ปริ้น
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
