"use client";

import { useLayoutEffect, useState } from "react";

const A4_WIDTH = 794;
const GUTTER = 24;

/**
 * ย่อใบเสร็จ A4 ให้พอดีจอ mobile ด้วย CSS zoom
 *
 * - เริ่มด้วย visibility:hidden เพื่อกัน flash เต็มขนาดก่อน hydrate
 * - useLayoutEffect รันก่อน paint → set zoom ถูกต้อง → show
 * - zoom ย่อ layout box จริง ปุ่มด้านล่างไหลตามพอดี
 * - desktop (≥818px) → zoom=1 เหมือนเดิม
 */
export function ReceiptFrame({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({
    width: A4_WIDTH,
    zoom: 1,
    visibility: "hidden", // ซ่อนก่อน JS คำนวณ zoom → ไม่มี flash
  });

  useLayoutEffect(() => {
    const fit = () => {
      const zoom = Math.min(1, (window.innerWidth - GUTTER) / A4_WIDTH);
      setStyle({ width: A4_WIDTH, zoom, visibility: "visible" });
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  return (
    <div className="receipt-frame mx-auto print:!zoom-[1] print:!w-auto" style={style}>
      {children}
    </div>
  );
}
