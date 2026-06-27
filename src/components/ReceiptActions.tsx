"use client";

import { useState } from "react";

/**
 * ปุ่มจัดการใบเสร็จ
 *
 * บันทึก PDF: html2canvas → jsPDF → .pdf download (ดาวน์โหลดไฟล์จริง)
 * พิมพ์:      window.print() → เครื่องพิมพ์ / Save as PDF ผ่าน browser
 * ปิด:        history.back() / /payouts
 *
 * html2canvas render .sheet (794px เต็ม ไม่รวม zoom wrapper)
 * → PDF ได้ขนาด A4 เต็มเสมอไม่ว่าจะดูบน mobile หรือ desktop
 */
export function ReceiptActions({ filename }: { filename: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    const el = document.querySelector<HTMLElement>(".sheet");
    if (!el) return;
    setBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      // render ที่ scale 2 = คมชัด retina; useCORS สำหรับรูปภาพ external
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const A4_W = 210;
      const imgH = (canvas.height / canvas.width) * A4_W;
      const pdf = new jsPDF({ unit: "mm", format: [A4_W, imgH], orientation: "portrait" });
      pdf.addImage(imgData, "JPEG", 0, 0, A4_W, imgH);
      pdf.save(`${filename}.pdf`);
    } catch {
      // fallback: ถ้า render ไม่ได้ → ให้ print dialog แทน
      window.print();
    } finally {
      setBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleClose() {
    // receipt เปิดผ่าน target="_blank" เสมอ → window.close() ปิด tab กลับหน้าเดิม
    // ถ้า browser ไม่ยอม close (บาง browser block) → back หรือ /payouts
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        if (window.history.length > 1) window.history.back();
        else window.location.href = "/payouts";
      }
    }, 300);
  }

  return (
    <div className="receipt-actions mx-auto flex w-full max-w-[794px] flex-col gap-2.5 px-3 py-6 sm:flex-row sm:items-center sm:justify-center print:hidden">
      {/* ดาวน์โหลด PDF */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 touch-manipulation sm:py-2.5"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        {busy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
      </button>

      {/* พิมพ์ */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 touch-manipulation sm:py-2.5"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
        </svg>
        พิมพ์
      </button>

      {/* ปิด */}
      <button
        type="button"
        onClick={handleClose}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 touch-manipulation sm:py-2.5"
      >
        ← ปิดหน้านี้
      </button>
    </div>
  );
}
