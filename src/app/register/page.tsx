import { AgentRegisterForm } from "@/components/AgentRegisterForm";

export const metadata = { title: "ลงทะเบียนนายหน้า — STACKA7" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-6 text-center">
        <img src="/logo-stacka7.png" alt="STACKA7" className="h-10 mx-auto mb-2" />
        <p className="text-sm text-slate-500">ระบบลงทะเบียนนายหน้า</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-1">ลงทะเบียนนายหน้า</h1>
        <p className="text-sm text-slate-500 mb-6">
          กรอกข้อมูลเบื้องต้น ทีมงานจะติดต่อกลับเพื่อเปิดใช้งาน
        </p>
        <AgentRegisterForm />
      </div>
    </div>
  );
}
