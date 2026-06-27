"use client";

import { useActionState } from "react";
import { saveCustomer } from "@/actions/customers";
import { emptyFormState, type FormState } from "@/lib/form";
import type { Customer } from "@/lib/types";
import Link from "next/link";
import { SubmitButton, Field, ErrorBanner, inputClass } from "./ui";

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [state, action] = useActionState<FormState, FormData>(saveCustomer, emptyFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <ErrorBanner message={state.error} />

      <Field label="ชื่อลูกค้า" required>
        <input
          className={inputClass}
          name="name"
          defaultValue={customer?.name}
          placeholder="ชื่อ-นามสกุล"
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="เบอร์โทร">
          <input className={inputClass} name="phone" defaultValue={customer?.phone} placeholder="08x-xxx-xxxx" />
        </Field>
        <Field label="อีเมล">
          <input className={inputClass} type="email" name="email" defaultValue={customer?.email} placeholder="email@example.com" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="บริษัท / องค์กร">
          <input className={inputClass} name="company" defaultValue={customer?.company} placeholder="ชื่อบริษัท" />
        </Field>
        <Field label="แหล่งที่มา">
          <input className={inputClass} name="source" defaultValue={customer?.source} placeholder="Facebook, Referral, …" />
        </Field>
      </div>

      <Field label="เว็บไซต์">
        <input
          className={inputClass}
          name="website"
          type="url"
          defaultValue={customer?.website ?? ""}
          placeholder="https://example.com"
        />
      </Field>

      <Field label="หมายเหตุ / เงื่อนไข">
        <textarea className={inputClass} name="note" defaultValue={customer?.note} rows={3} placeholder="บันทึกเพิ่มเติม" />
      </Field>

      <div className="flex gap-3 pt-2">
        <SubmitButton label={customer ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"} />
        <Link href="/customers" className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-slate-100 transition-colors">
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
