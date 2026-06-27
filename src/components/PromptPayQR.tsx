"use client";

import { usePromptPayQR } from "@/hooks/usePromptPayQR";

interface Props {
  value: string;
  size?: number;
  showLabel?: boolean;
}

export function PromptPayQR({ value, size = 160, showLabel = true }: Props) {
  const { dataUrl, error } = usePromptPayQR({ promptpay: value, width: size * 2 });

  if (error) return <p className="text-xs text-red-500">ไม่สามารถสร้าง QR Code ได้</p>;
  if (!dataUrl) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="bg-white border border-border rounded-xl p-2 shadow-sm"
        style={{ width: size + 16, height: size + 16 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image does not support data: scheme */}
        <img
          src={dataUrl}
          alt={`PromptPay QR สำหรับ ${value}`}
          style={{ width: size, height: size }}
        />
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-semibold text-foreground">PromptPay</p>
          <p className="text-xs text-muted">{value}</p>
        </div>
      )}
    </div>
  );
}
