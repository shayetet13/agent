"use client";

import { useFormStatus } from "react-dom";

/** ปุ่ม submit ที่ disable อัตโนมัติตอน pending */
export function SubmitButton({
  label = "บันทึก",
  pendingLabel = "กำลังบันทึก…",
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/** field wrapper พร้อม label */
export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent";

export { inputClass };

/** แถบแสดง error จาก FormState */
export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

/** Badge สถานะ */
export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const cls: Record<string, string> = {
    default: "bg-indigo-100 text-indigo-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    muted: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls[variant]}`}>
      {children}
    </span>
  );
}
