"use client";

import { useActionState, useRef, useState } from "react";
import { uploadPaymentSlip, deletePaymentSlip, type PaymentSlipState, type DeleteSlipState } from "@/actions/payments";

interface Props {
  paymentId: string;
  customerId: string;
  initialSlipUrls: string[];
}

const INIT_UPLOAD: PaymentSlipState = {};
const INIT_DELETE: DeleteSlipState = {};

export function PaymentSlips({ paymentId, customerId, initialSlipUrls }: Props) {
  const [uploadState, uploadAction, uploading] = useActionState(uploadPaymentSlip, INIT_UPLOAD);
  const [deleteState, deleteAction, deleting]  = useActionState(deletePaymentSlip, INIT_DELETE);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // รวม URL จาก optimistic upload และลบ URL ที่เพิ่งถูกลบออก
  const deletedUrl = deleteState.deleted;
  const baseUrls = deletedUrl
    ? initialSlipUrls.filter((u) => u !== deletedUrl)
    : initialSlipUrls;
  const slipUrls = uploadState.url && !baseUrls.includes(uploadState.url)
    ? [...baseUrls, uploadState.url]
    : baseUrls;

  function confirmDelete(url: string) {
    if (!confirm("ลบสลิปนี้ออกจากระบบ?")) return;
    const fd = new FormData();
    fd.set("paymentId",  paymentId);
    fd.set("customerId", customerId);
    fd.set("url", url);
    deleteAction(fd);
    if (lightbox === url) setLightbox(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {slipUrls.map((url, i) => (
          <div key={url} className="group relative h-14 w-14 shrink-0">
            {/* thumbnail */}
            <button
              type="button"
              onClick={() => setLightbox(url)}
              className="h-14 w-14 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-accent transition-all"
              title={`สลิป ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`สลิป ${i + 1}`} className="h-full w-full object-cover" />
            </button>

            {/* ปุ่มลบ — แสดงเมื่อ hover */}
            <button
              type="button"
              onClick={() => confirmDelete(url)}
              disabled={deleting}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 shadow-sm"
              title="ลบสลิป"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Upload button */}
        <form action={uploadAction} className="contents">
          <input type="hidden" name="paymentId"  value={paymentId} />
          <input type="hidden" name="customerId" value={customerId} />
          <input
            ref={inputRef}
            type="file"
            name="slip"
            accept="image/*"
            className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) (e.target.form as HTMLFormElement).requestSubmit(); }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-14 w-14 rounded-lg border border-dashed border-border hover:border-accent hover:bg-accent/5 transition-colors flex flex-col items-center justify-center gap-0.5 shrink-0 disabled:opacity-50"
            title="เพิ่มสลิป"
          >
            {uploading ? (
              <svg className="w-5 h-5 text-muted animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] text-muted leading-none">สลิป</span>
              </>
            )}
          </button>
        </form>

        {uploadState.error && <p className="text-xs text-red-600 w-full mt-1">{uploadState.error}</p>}
        {deleteState.error && <p className="text-xs text-red-600 w-full mt-1">{deleteState.error}</p>}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="สลิปโอนเงิน"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* ปิด lightbox */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ลบจาก lightbox */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); confirmDelete(lightbox); }}
            disabled={deleting}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? "กำลังลบ…" : "ลบสลิปนี้"}
          </button>
        </div>
      )}
    </>
  );
}
