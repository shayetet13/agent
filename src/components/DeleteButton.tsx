"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "./ConfirmModal";

export function DeleteButton({
  action,
  id,
  confirmTitle = "ยืนยันการลบ",
  confirmMessage,
  label = "ลบ",
  redirectTo,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmTitle?: string;
  confirmMessage: string;
  label?: string;
  redirectTo?: string;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleClick() {
    const ok = await confirm({ title: confirmTitle, message: confirmMessage, confirmLabel: "ลบ", danger: true });
    if (!ok) return;
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      try {
        await action(formData);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ไม่สามารถลบได้");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {pending ? "กำลังลบ…" : label}
    </button>
  );
}

export function DeleteDealButton({
  action,
  id,
  dealId,
  confirmTitle = "ยืนยันการลบ",
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  dealId: string;
  confirmTitle?: string;
  confirmMessage: string;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleClick() {
    const ok = await confirm({ title: confirmTitle, message: confirmMessage, confirmLabel: "ลบ", danger: true });
    if (!ok) return;
    const formData = new FormData();
    formData.set("id", id);
    formData.set("dealId", dealId);
    startTransition(async () => {
      try {
        await action(formData);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ไม่สามารถลบได้");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? "…" : "ลบ"}
    </button>
  );
}
