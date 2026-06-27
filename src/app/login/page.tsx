"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { loginAction, type LoginState } from "./action";

function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const from = useSearchParams().get("from") ?? "/";

  return (
    <div className="h-svh flex flex-col items-center justify-center bg-white px-4 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* Logo */}
        <div className="text-center">
          <Image
            src="/logo-stacka7.png"
            alt="Stacka7"
            width={128}
            height={128}
            className="mx-auto h-32 w-auto object-contain"
            priority
          />
          <p className="mt-3 text-sm text-zinc-500">กรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">

          {/* Error */}
          {state.error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {state.error}
            </div>
          )}

          <form action={action} className="flex flex-col gap-3.5">
            <input type="hidden" name="from" value={from} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">ชื่อผู้ใช้</label>
              <input
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="username"
                className="h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">รหัสผ่าน</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10 w-full rounded-md border border-zinc-300 bg-transparent px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 h-10 w-full rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400">สำหรับใช้งานภายในเท่านั้น</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
