"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  className?: string;
}

export function ActionButton({ action, fields, label, pendingLabel, className }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    for (const [k, v] of Object.entries(fields)) formData.set(k, v);
    startTransition(async () => {
      await action(formData);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isPending}
        className={className}
      >
        {isPending ? (pendingLabel ?? "…") : label}
      </button>
    </form>
  );
}
