"use client";

import { useEffect } from "react";

export default function RegisterSuccessPage() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.replace("/login");
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ✅
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">ลงทะเบียนสำเร็จ!</h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          ได้รับข้อมูลของคุณแล้ว ทีมงาน STACKA7 จะติดต่อกลับเพื่อเปิดใช้งานบัญชีและแจ้ง username / password สำหรับเข้าสู่ระบบ
        </p>
        <p className="text-xs text-slate-400 mb-4">
          มีข้อสงสัย ติดต่อ LINE:{" "}
          <span className="font-medium text-slate-600">@249zwjwl</span>
        </p>
        <p className="text-xs text-slate-300">กำลังพากลับไปหน้า login…</p>
      </div>
    </div>
  );
}
