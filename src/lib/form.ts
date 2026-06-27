import type { z } from "zod";

export interface FormState {
  ok?: boolean;
  error?: string;
}

export const emptyFormState: FormState = {};

/** ดึงข้อความ error แรกจากผล safeParse ของ zod */
export function firstError(result: z.ZodSafeParseResult<unknown>): string {
  if (result.success) return "";
  return result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}
