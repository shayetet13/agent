"use client";

import { useLayoutEffect, useState } from "react";

const A4_WIDTH = 794;
const GUTTER = 32;

export function QuotationFrame({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({
    width: A4_WIDTH,
    zoom: 1,
    visibility: "hidden",
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
    <div className="mx-auto print:!zoom-[1] print:!w-auto" style={style}>
      {children}
    </div>
  );
}
