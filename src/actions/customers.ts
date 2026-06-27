"use server";

import { revalidateTag } from "next/cache";
import { DATA_TAG } from "@/lib/db";
import { redirect } from "next/navigation";
import { insert, remove, update } from "@/lib/db";
import { getSession } from "@/lib/session";
import { customerSchema, formToObject } from "@/lib/schemas";
import { firstError, type FormState } from "@/lib/form";

export async function saveCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (session?.type !== "admin") return { error: "ไม่มีสิทธิ์" };

  const id = String(formData.get("id") ?? "").trim();
  const result = customerSchema.safeParse(formToObject(formData));
  if (!result.success) return { error: firstError(result) };

  if (id) {
    await update("customers", id, result.data);
  } else {
    await insert("customers", result.data);
  }
  revalidateTag(DATA_TAG, { expire: 0 });
  redirect("/customers");
}

export async function deleteCustomer(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await remove("customers", id);
    revalidateTag(DATA_TAG, { expire: 0 });
  }
}
