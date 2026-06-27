"use client";

import { useActionState } from "react";
import { saveAgentCredentials } from "@/actions/agents";
import { emptyFormState, type FormState } from "@/lib/form";
import { SubmitButton, Field, ErrorBanner, inputClass } from "./ui";

export function AgentCredentialForm({
  agentId,
  currentUsername,
}: {
  agentId: string;
  currentUsername?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveAgentCredentials, emptyFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={agentId} />
      <ErrorBanner message={state.error} />
      {state.ok && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          บันทึกข้อมูล login เรียบร้อยแล้ว
        </div>
      )}

      <Field label="Username (ใช้สำหรับ login)">
        <input
          className={inputClass}
          name="username"
          defaultValue={currentUsername ?? ""}
          placeholder="ชื่อผู้ใช้ (ว่าง = ปิด portal)"
          autoComplete="off"
        />
      </Field>

      <Field label="Password">
        <input
          className={inputClass}
          type="password"
          name="password"
          placeholder="ว่างไว้ = ไม่เปลี่ยนรหัสผ่านเดิม"
          autoComplete="new-password"
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <SubmitButton label="บันทึก Login" />
      </div>
    </form>
  );
}
