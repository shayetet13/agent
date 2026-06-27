"use client";

import { useState, useTransition } from "react";
import { submitLead, type LeadInput } from "@/actions/leads";

const BUSINESS_TYPES = [
  { label: "ร้านค้า", icon: "🛍️" },
  { label: "บริษัท", icon: "🏢" },
  { label: "คลินิก", icon: "🏥" },
  { label: "หอพัก", icon: "🏠" },
  { label: "โรงแรม", icon: "🏨" },
  { label: "ร้านอาหาร", icon: "🍜" },
  { label: "โรงงาน", icon: "🏭" },
  { label: "อสังหาริมทรัพย์", icon: "🏗️" },
  { label: "การศึกษา", icon: "📚" },
  { label: "อื่นๆ", icon: "✨" },
];

const WORK_TYPES = [
  "Website", "Landing Page", "E-Commerce", "Web Application",
  "Dashboard", "ระบบสมาชิก", "ระบบจองคิว", "ระบบหอพัก",
  "ระบบสัญญาออนไลน์", "ระบบจัดการลูกค้า",
  "Line OA", "LINE Chatbot", "AI Chatbot",
  "AI Sales Agent", "ระบบเฉพาะทาง",
];

const BUDGETS = [
  { label: "ต่ำกว่า 10,000", sub: "งบเริ่มต้น" },
  { label: "10,000 – 30,000", sub: "SME" },
  { label: "30,000 – 50,000", sub: "Standard" },
  { label: "50,000 – 100,000", sub: "Professional" },
  { label: "มากกว่า 100,000", sub: "Enterprise" },
  { label: "ยังไม่กำหนด", sub: "ยืดหยุ่น" },
];

const STEPS = [
  "ข้อมูลนายหน้า",
  "ข้อมูลลูกค้า",
  "ประเภทธุรกิจ",
  "ประเภทงาน",
  "งบประมาณ",
  "เว็บไซต์ตัวอย่าง",
  "รายละเอียดเพิ่มเติม",
  "ตรวจสอบและส่ง",
];

interface Props {
  defaultBrokerName?: string;
  defaultBrokerPhone?: string;
  defaultBrokerLine?: string;
}

export function LeadForm({ defaultBrokerName = "", defaultBrokerPhone = "", defaultBrokerLine = "" }: Props) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState<LeadInput>({
    brokerName: defaultBrokerName,
    brokerPhone: defaultBrokerPhone,
    brokerLine: defaultBrokerLine,
    customerName: "",
    customerPhone: "",
    customerLine: "",
    customerCompany: "",
    businessType: "",
    workTypes: [],
    budget: "",
    exampleUrl: "",
    details: "",
  });

  function set(key: keyof LeadInput, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleWorkType(val: string) {
    setForm((prev) => ({
      ...prev,
      workTypes: prev.workTypes.includes(val)
        ? prev.workTypes.filter((v) => v !== val)
        : [...prev.workTypes, val],
    }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    setError("");
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await submitLead(form);
      if (result?.error) setError(result.error);
    });
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #16181d 0%, #2d1f3d 50%, #ff2e63 100%)" }} className="px-4 py-6 text-white">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-medium tracking-widest opacity-60 uppercase mb-1">Partner Lead Collection</p>
          <h1 className="text-2xl font-bold">ส่งข้อมูลลูกค้า</h1>
          <p className="text-sm opacity-70 mt-1">ขั้นตอนที่ {step + 1} จาก {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-1 transition-all duration-500"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #ff6a1a, #ff2e63)" }}
        />
      </div>

      {/* Step indicators */}
      <div className="max-w-xl mx-auto w-full px-4 py-4">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i < step ? "linear-gradient(90deg, #ff6a1a, #ff2e63)" : i === step ? "#ff6a1a" : "#e2e8f0",
                opacity: i > step ? 0.4 : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-xl mx-auto w-full px-4 pb-8 flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">

            {/* Step 0: ข้อมูลนายหน้า */}
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={1} title="ข้อมูลนายหน้า" desc="ชื่อและช่องทางติดต่อของคุณ" />
                <Field label="ชื่อ-นามสกุล" value={form.brokerName} onChange={(v) => set("brokerName", v)} placeholder="เก๊า สมชาย" />
                <Field label="เบอร์โทร" value={form.brokerPhone} onChange={(v) => set("brokerPhone", v)} placeholder="08x-xxx-xxxx" type="tel" />
                <Field label="LINE ID" value={form.brokerLine} onChange={(v) => set("brokerLine", v)} placeholder="@lineid" />
              </div>
            )}

            {/* Step 1: ข้อมูลลูกค้า */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={2} title="ข้อมูลลูกค้า" desc="ข้อมูลติดต่อของลูกค้าที่คุณแนะนำ" />
                <Field label="ชื่อลูกค้า" value={form.customerName} onChange={(v) => set("customerName", v)} placeholder="ชื่อเจ้าของกิจการ" />
                <Field label="เบอร์โทร" value={form.customerPhone} onChange={(v) => set("customerPhone", v)} placeholder="08x-xxx-xxxx" type="tel" />
                <Field label="LINE ID" value={form.customerLine} onChange={(v) => set("customerLine", v)} placeholder="@lineid" />
                <Field label="บริษัท / ร้านค้า" value={form.customerCompany} onChange={(v) => set("customerCompany", v)} placeholder="ชื่อกิจการ" />
              </div>
            )}

            {/* Step 2: ประเภทธุรกิจ */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={3} title="ประเภทธุรกิจ" desc="ลูกค้าอยู่ในกลุ่มธุรกิจใด" />
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map(({ label, icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("businessType", label)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                        form.businessType === label
                          ? "border-transparent text-white shadow-md"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 bg-white"
                      }`}
                      style={form.businessType === label ? { background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" } : {}}
                    >
                      <span className="text-xl">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: ประเภทงาน */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={4} title="ประเภทงาน" desc="เลือกได้หลายรายการ" />
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map((wt) => {
                    const selected = form.workTypes.includes(wt);
                    return (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => toggleWorkType(wt)}
                        className={`px-3.5 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                          selected
                            ? "border-transparent text-white shadow-sm"
                            : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                        }`}
                        style={selected ? { background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" } : {}}
                      >
                        {wt}
                      </button>
                    );
                  })}
                </div>
                {form.workTypes.length > 0 && (
                  <p className="text-xs text-slate-500">เลือกแล้ว {form.workTypes.length} รายการ</p>
                )}
              </div>
            )}

            {/* Step 4: งบประมาณ */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={5} title="งบประมาณโดยประมาณ" desc="ลูกค้ามีงบประมาณในช่วงใด" />
                <div className="flex flex-col gap-2">
                  {BUDGETS.map(({ label, sub }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("budget", label)}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        form.budget === label
                          ? "border-transparent text-white shadow-md"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                      style={form.budget === label ? { background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" } : {}}
                    >
                      <span className="text-sm font-semibold">{label}</span>
                      <span className={`text-xs ${form.budget === label ? "opacity-70" : "text-slate-400"}`}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: เว็บไซต์ตัวอย่าง */}
            {step === 5 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={6} title="เว็บไซต์ตัวอย่าง" desc="ลูกค้าชอบสไตล์เว็บแบบไหน (ไม่จำเป็น)" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL เว็บที่ชอบ</label>
                  <input
                    type="url"
                    value={form.exampleUrl}
                    onChange={(e) => set("exampleUrl", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": "#ff6a1a" } as React.CSSProperties}
                  />
                  <p className="text-xs text-slate-400 mt-2">ใส่ URL เว็บที่ลูกค้าชอบสไตล์ หรือเว็บคู่แข่ง</p>
                </div>
              </div>
            )}

            {/* Step 6: รายละเอียดเพิ่มเติม */}
            {step === 6 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={7} title="รายละเอียดเพิ่มเติม" desc="ข้อมูลเพิ่มเติมที่เป็นประโยชน์ (ไม่จำเป็น)" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">หมายเหตุ / ความต้องการพิเศษ</label>
                  <textarea
                    value={form.details}
                    onChange={(e) => set("details", e.target.value)}
                    placeholder="เช่น: ลูกค้าต้องการระบบที่เชื่อมกับ LINE ต้องการให้เสร็จภายใน 2 เดือน..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Review */}
            {step === 7 && (
              <div className="flex flex-col gap-5">
                <StepHeader num={8} title="ตรวจสอบข้อมูล" desc="ตรวจสอบก่อนส่ง — สามารถแก้ไขได้โดยกดย้อนกลับ" />

                <ReviewSection title="นายหน้า">
                  <ReviewRow label="ชื่อ" value={form.brokerName} />
                  <ReviewRow label="เบอร์โทร" value={form.brokerPhone} />
                  <ReviewRow label="LINE" value={form.brokerLine} />
                </ReviewSection>

                <ReviewSection title="ลูกค้า">
                  <ReviewRow label="ชื่อ" value={form.customerName} />
                  <ReviewRow label="เบอร์โทร" value={form.customerPhone} />
                  <ReviewRow label="LINE" value={form.customerLine} />
                  <ReviewRow label="กิจการ" value={form.customerCompany} />
                </ReviewSection>

                <ReviewSection title="รายละเอียดงาน">
                  <ReviewRow label="ประเภทธุรกิจ" value={form.businessType} />
                  <ReviewRow label="งานที่ต้องการ" value={form.workTypes.join(", ") || "—"} />
                  <ReviewRow label="งบประมาณ" value={form.budget} />
                  <ReviewRow label="เว็บตัวอย่าง" value={form.exampleUrl} />
                </ReviewSection>

                {form.details && (
                  <ReviewSection title="หมายเหตุ">
                    <p className="text-sm text-slate-600 leading-relaxed">{form.details}</p>
                  </ReviewSection>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                disabled={pending}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors disabled:opacity-50"
              >
                ← ย้อนกลับ
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
              >
                ถัดไป →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
              >
                {pending ? "กำลังส่ง…" : "✓ ส่งข้อมูล"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-1">
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #ff6a1a, #ff2e63)" }}
      >
        {num}
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} <span className="text-slate-400 font-normal text-xs">(ไม่บังคับ)</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
      />
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-slate-400 shrink-0 w-24">{label}</span>
      <span className="text-slate-800 font-medium">{value || "—"}</span>
    </div>
  );
}
