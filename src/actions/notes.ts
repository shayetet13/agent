"use server";

import { revalidateTag } from "next/cache";
import { insert, remove, DATA_TAG } from "@/lib/db";
import { getSession } from "@/lib/session";
import { noteSchema, formToObject } from "@/lib/schemas";

export async function addNote(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;
  const raw = formToObject(formData);
  const result = noteSchema.safeParse(raw);
  if (!result.success) return;
  await insert("notes", result.data);
  revalidateTag(DATA_TAG, { expire: 0 });
}

export async function deleteNote(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.type !== "admin") return;

  const id = formData.get("id")?.toString() ?? "";
  if (!id) return;
  await remove("notes", id);
  revalidateTag(DATA_TAG, { expire: 0 });
}
